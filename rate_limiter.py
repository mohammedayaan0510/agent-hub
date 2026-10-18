import time
import redis.asyncio as redis
from fastapi import Request, HTTPException, status

# Connect to Redis
redis_client = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)


class SlidingWindowRateLimiter:
    def __init__(self, requests_per_window: int = 60, window_seconds: int = 60):
        self.max_requests = requests_per_window
        self.window_seconds = window_seconds

    async def check_rate_limit(self, key_identifier: str) -> dict:
        """
        Checks the sliding window rate limit for a given API key.
        Returns a dict containing remaining quota and reset window information.
        """
        now = time.time()
        clear_before = now - self.window_seconds
        redis_key = f"rate_limit:{key_identifier}"

        async with redis_client.pipeline(transaction=True) as pipe:
            # 1. Remove timestamps older than current sliding window
            pipe.zremrangebyscore(redis_key, 0, clear_before)
            # 2. Count requests remaining in sliding window
            pipe.zcard(redis_key)
            # 3. Add current timestamp to window
            pipe.zadd(redis_key, {str(now): now})
            # 4. Set TTL on the set key for automatic cleanup
            pipe.expire(redis_key, self.window_seconds)

            results = await pipe.execute()

        request_count = results[1]
        remaining = max(0, self.max_requests - request_count - 1)
        reset_timestamp = int(now + self.window_seconds)

        if request_count >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Rate limit exceeded",
                    "limit": self.max_requests,
                    "window_seconds": self.window_seconds,
                    "message": "Too many requests in sliding window. Try again shortly.",
                },
                headers={
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_timestamp),
                },
            )

        return {
            "limit": self.max_requests,
            "remaining": remaining,
            "reset": reset_timestamp,
        }