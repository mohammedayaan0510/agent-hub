import time
import asyncio
from typing import Optional
from fastapi import FastAPI, Depends, Header, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os

from rate_limiter import SlidingWindowRateLimiter

# Initialize FastAPI App
app = FastAPI(title="AgentHub Proxy Gateway", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase Client
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "your-service-role-key")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Global Rate Limiter: 60 requests / 60 seconds per API Key
limiter = SlidingWindowRateLimiter(requests_per_window=60, window_seconds=60)


async def log_usage_to_supabase(
    buyer_id: str,
    agent_id: str,
    status_code: int,
    latency_ms: int,
    cost_usd: float = 0.0050,
):
    """
    Asynchronous background task to record execution telemetry into Supabase usage_logs.
    Runs non-blockingly after the response is dispatched.
    """
    try:
        data = {
            "buyer_id": buyer_id,
            "agent_id": agent_id,
            "status_code": status_code,
            "latency_ms": latency_ms,
            "cost_usd": cost_usd,
        }
        supabase.table("usage_logs").insert(data).execute()
    except Exception as e:
        print(f"⚠️ [Usage Logger Error] Failed to write log to Supabase: {e}")


async def verify_api_key_and_rate_limit(
    response: Response,
    authorization: str = Header(...),
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer ag_live_...'",
        )

    api_key = authorization.split("Bearer ")[1].strip()

    # Perform sliding window check in Redis
    limit_info = await limiter.check_rate_limit(key_identifier=api_key)

    # Inject standard rate limit headers into outgoing response
    response.headers["X-RateLimit-Limit"] = str(limit_info["limit"])
    response.headers["X-RateLimit-Remaining"] = str(limit_info["remaining"])
    response.headers["X-RateLimit-Reset"] = str(limit_info["reset"])

    return api_key


@app.post("/v1/proxy/{agent_id}")
async def proxy_agent_request(
    agent_id: str,
    payload: dict,
    api_key: str = Depends(verify_api_key_and_rate_limit),
):
    start_time = time.time()
    buyer_id = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"  # Derived from API key hash lookup
    status_code = 200
    cost_per_call = 0.0050

    try:
        # Simulate agent execution call
        await asyncio.sleep(0.05)  # Simulated upstream delay
        
        response_payload = {
            "status": "success",
            "agent_id": agent_id,
            "result": "Agent executed successfully via gateway proxy.",
            "payload_received": payload,
        }
        return response_payload

    except Exception as err:
        status_code = 500
        raise HTTPException(status_code=500, detail=str(err))

    finally:
        # Calculate execution duration in milliseconds
        latency_ms = int((time.time() - start_time) * 1000)

        # Dispatch background logging task without blocking response dispatch
        asyncio.create_task(
            log_usage_to_supabase(
                buyer_id=buyer_id,
                agent_id=agent_id,
                status_code=status_code,
                latency_ms=latency_ms,
                cost_usd=cost_per_call,
            )
        )