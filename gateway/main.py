import os
import time
import hashlib
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import redis

load_dotenv()

app = FastAPI(title="AgentHub API Gateway", version="1.0.0")

# ------------------------------------------------------------------------------
# 1. CORS Configuration
# ------------------------------------------------------------------------------
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# 2. Clients Initialization (Supabase & Redis)
# ------------------------------------------------------------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
REDIS_URL = os.getenv("REDIS_URL", "")

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

redis_client = None
if REDIS_URL:
    try:
        redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
    except Exception as e:
        print(f"Warning: Redis connection failed ({e}). Proceeding without rate limiting.")

# ------------------------------------------------------------------------------
# 3. Rate Limiting Middleware Function
# ------------------------------------------------------------------------------
def check_rate_limit(buyer_id: str, limit: int = 60, window_seconds: int = 60):
    if not redis_client:
        return  # Fallback if Redis is not configured

    current_time = int(time.time())
    key = f"rate_limit:{buyer_id}:{current_time // window_seconds}"
    
    try:
        requests = redis_client.incr(key)
        if requests == 1:
            redis_client.expire(key, window_seconds)
        
        if requests > limit:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again in a minute.")
    except redis.RedisError as e:
        print(f"Redis error during rate limiting: {e}")

# ------------------------------------------------------------------------------
# 4. API Key Verification Dependency
# ------------------------------------------------------------------------------
async def verify_api_key(x_api_key: Optional[str] = Header(None)):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header.")

    if not supabase:
        raise HTTPException(status_code=500, detail="Database client uninitialized.")

    # Compute SHA-256 hash of incoming raw API Key
    key_hash = hashlib.sha256(x_api_key.encode("utf-8")).hexdigest()

    # Query api_keys table using buyer_id
    response = supabase.table("api_keys").select("id, buyer_id, is_active").eq("key_hash", key_hash).execute()

    if not response.data:
        raise HTTPException(status_code=401, detail="Invalid API Key.")

    key_record = response.data[0]
    if not key_record.get("is_active", False):
        raise HTTPException(status_code=403, detail="API Key has been revoked or deactivated.")

    # Apply sliding-window rate limit
    check_rate_limit(buyer_id=key_record["buyer_id"])

    return key_record

# ------------------------------------------------------------------------------
# 5. Route Definitions
# ------------------------------------------------------------------------------
class ProxyPayload(BaseModel):
    model: Optional[str] = "agent-v1"
    prompt: Optional[str] = ""
    max_tokens: Optional[int] = 100

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "redis": "connected" if redis_client else "disconnected",
        "supabase": "connected" if supabase else "disconnected",
    }

@app.post("/v1/proxy")
async def proxy_agent_request(payload: ProxyPayload, key_record: dict = Depends(verify_api_key)):
    buyer_id = key_record["buyer_id"]
    api_key_id = key_record["id"]

    # Record telemetry into usage_logs using buyer_id
    try:
        supabase.table("usage_logs").insert({
            "buyer_id": buyer_id,
            "api_key_id": api_key_id,
            "endpoint": "/v1/proxy",
            "status_code": 200,
            "tokens_used": payload.max_tokens or 100,
        }).execute()
    except Exception as e:
        print(f"Failed to record usage telemetry: {e}")

    return {
        "success": True,
        "message": "Proxy request successfully processed by gateway.",
        "buyer_id": buyer_id,
        "model": payload.model,
        "tokens_used": payload.max_tokens,
    }