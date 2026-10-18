import os
import time
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Security, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from supabase import create_client, Client
import redis

# ------------------------------------------------------------------------------
# 1. Initialization & Configuration
# ------------------------------------------------------------------------------
app = FastAPI(
    title="AgentHub Gateway API",
    description="Production Proxy Gateway for AI Agent Marketplace",
    version="1.0.0"
)

# ------------------------------------------------------------------------------
# 2. Production CORS Middleware
# ------------------------------------------------------------------------------
# Parse allowed origins from environment variable or fallback to defaults
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# 3. Database & Redis Clients
# ------------------------------------------------------------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Missing required SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Redis client setup with graceful in-memory fallback
REDIS_URL = os.getenv("REDIS_URL")
redis_client: Optional[redis.Redis] = None
in_memory_rate_limit_store = {}

if REDIS_URL:
    try:
        redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        redis_client.ping()
        print(" Successfully connected to Upstash Redis for rate limiting.")
    except Exception as e:
        print(f" Warning: Could not connect to Redis ({e}). Falling back to in-memory rate limiting.")
        redis_client = None

# ------------------------------------------------------------------------------
# 4. Security & Rate Limiting Logic
# ------------------------------------------------------------------------------
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def check_rate_limit(api_key: str, limit: int = 60, window_seconds: int = 60) -> bool:
    """Sliding window rate limiter using Redis or in-memory fallback."""
    current_time = int(time.time())
    key = f"rate_limit:{api_key}:{current_time // window_seconds}"
    
    if redis_client:
        try:
            pipe = redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, window_seconds)
            results = pipe.execute()
            request_count = results[0]
            return request_count <= limit
        except Exception:
            pass  # Fall back to in-memory if Redis fails during runtime

    # In-memory fallback tracking
    request_count = in_memory_rate_limit_store.get(key, 0) + 1
    in_memory_rate_limit_store[key] = request_count
    return request_count <= limit


async def verify_api_key(api_key: str = Depends(api_key_header)):
    """Validates incoming API Key against Supabase and checks rate limits."""
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required X-API-Key header."
        )

    # 1. Check rate limit
    if not check_rate_limit(api_key, limit=60, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait before making more requests."
        )

    # 2. Validate API key in Supabase database
    try:
        response = supabase.table("api_keys").select("id, user_id, is_active").eq("key_hash", api_key).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API Key."
            )
            
        key_data = response.data[0]
        if not key_data.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This API Key has been revoked or deactivated."
            )

        return key_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gateway internal authentication error: {str(e)}"
        )

# ------------------------------------------------------------------------------
# 5. Route Handlers
# ------------------------------------------------------------------------------
@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """System status check used by Render health checks."""
    return {
        "status": "ok",
        "redis": "connected" if redis_client else "in-memory-fallback",
        "environment": os.getenv("ENVIRONMENT", "production")
    }


@app.post("/v1/proxy")
async def proxy_agent_request(request: Request, key_data: dict = Depends(verify_api_key)):
    """Primary proxy endpoint for AI agent invocation and telemetry logging."""
    payload = await request.json()
    user_id = key_data["user_id"]

    # Log telemetry into Supabase usage_logs table
    try:
        supabase.table("usage_logs").insert({
            "user_id": user_id,
            "api_key_id": key_data["id"],
            "endpoint": "/v1/proxy",
            "status_code": 200,
            "tokens_used": payload.get("max_tokens", 100)
        }).execute()
    except Exception as e:
        print(f"Failed to record usage telemetry: {e}")

    # Return proxy mock response
    return {
        "success": True,
        "message": "Proxy request processed successfully",
        "user_id": user_id,
        "data": payload
    }