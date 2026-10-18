import hashlib
import time
import os
from typing import Dict, Any, Tuple
from fastapi import FastAPI, Request, Header, HTTPException, status
from fastapi.responses import JSONResponse
import httpx
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Load Supabase Credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY) if (SUPABASE_URL and SUPABASE_SERVICE_KEY) else None

app = FastAPI(
    title="AI Agent Marketplace Gateway Proxy",
    version="1.0.0"
)

# Shared async HTTP client for connection pooling
http_client = httpx.AsyncClient(timeout=60.0)

@app.on_event("shutdown")
async def shutdown_event():
    await http_client.aclose()


@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "AI Agent Marketplace Gateway Proxy",
        "version": "1.0.0"
    }


def hash_api_key(raw_key: str) -> str:
    """Computes SHA-256 hash of raw API key for DB verification."""
    return hashlib.sha256(raw_key.strip().encode("utf-8")).hexdigest()


async def authenticate_and_authorize(
    raw_api_key: str, agent_id: str
) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection not configured in environment variables."
        )

    key_hash = hash_api_key(raw_api_key)

    # 1. Look up the API key
    key_res = supabase.table("api_keys") \
        .select("id, buyer_id, is_active") \
        .eq("key_hash", key_hash) \
        .execute()

    if not key_res.data or not key_res.data[0]["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API Key."
        )

    api_key_data = key_res.data[0]
    buyer_id = api_key_data["buyer_id"]

    # 2. Fetch Agent details and active production version endpoint
    agent_res = supabase.table("agents") \
        .select("id, seller_id, status, pricing_type, price_per_unit") \
        .eq("id", agent_id) \
        .execute()

    if not agent_res.data or agent_res.data[0]["status"] != "published":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found or unavailable."
        )

    agent_data = agent_res.data[0]

    version_res = supabase.table("agent_versions") \
        .select("endpoint_url") \
        .eq("agent_id", agent_id) \
        .eq("is_active", True) \
        .execute()

    if not version_res.data or not version_res.data[0]["endpoint_url"]:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No active execution endpoint configured for this agent."
        )

    agent_data["endpoint_url"] = version_res.data[0]["endpoint_url"]

    # 3. Check Buyer Subscription / Credit Balance
    sub_res = supabase.table("subscriptions") \
        .select("id, status, credit_balance") \
        .eq("buyer_id", buyer_id) \
        .eq("agent_id", agent_id) \
        .execute()

    if not sub_res.data or sub_res.data[0]["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Active subscription or access purchase required for this agent."
        )

    sub_data = sub_res.data[0]

    # If pay_per_call, check that buyer has sufficient credit
    cost_per_call = float(agent_data["price_per_unit"])
    if agent_data["pricing_type"] == "pay_per_call":
        if float(sub_data["credit_balance"]) < cost_per_call:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Insufficient credit balance to invoke agent."
            )

    return api_key_data, agent_data, sub_data


async def record_execution(
    agent_id: str,
    buyer_id: str,
    api_key_id: str,
    subscription_id: str,
    status_code: int,
    latency_ms: int,
    cost_charged: float,
    pricing_type: str
):
    seller_acc = supabase.table("seller_accounts") \
        .select("platform_commission_rate") \
        .execute()
    
    commission_rate = 0.15
    if seller_acc.data and seller_acc.data[0].get("platform_commission_rate"):
        commission_rate = float(seller_acc.data[0]["platform_commission_rate"]) / 100.0

    seller_payout = cost_charged * (1.0 - commission_rate)

    # Log execution telemetry
    supabase.table("execution_logs").insert({
        "agent_id": agent_id,
        "buyer_id": buyer_id,
        "api_key_id": api_key_id,
        "status_code": status_code,
        "latency_ms": latency_ms,
        "cost_charged": cost_charged,
        "seller_payout": seller_payout,
    }).execute()

    # Increment agent call counter
    supabase.rpc("increment_agent_calls", {"agent_id_param": agent_id}).execute()

    # Deduct credits if pay_per_call
    if pricing_type == "pay_per_call" and status_code < 400 and cost_charged > 0:
        supabase.rpc(
            "deduct_subscription_credits",
            {"sub_id_param": subscription_id, "amount_param": cost_charged}
        ).execute()


@app.post("/v1/agents/{agent_id}/execute")
async def execute_agent(
    agent_id: str,
    request: Request,
    authorization: str = Header(..., description="Format: Bearer <agx_live_...>"),
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must start with 'Bearer '"
        )
    raw_api_key = authorization.replace("Bearer ", "").strip()

    api_key_data, agent_data, sub_data = await authenticate_and_authorize(
        raw_api_key, agent_id
    )

    buyer_id = api_key_data["buyer_id"]
    api_key_id = api_key_data["id"]
    subscription_id = sub_data["id"]
    target_url = agent_data["endpoint_url"]
    cost_charged = float(agent_data["price_per_unit"])

    body = await request.body()

    start_time = time.perf_counter()
    try:
        response = await http_client.post(
            target_url,
            content=body,
            headers={
                "Content-Type": request.headers.get("Content-Type", "application/json"),
                "X-AgentMarketplace-Buyer-ID": buyer_id,
            },
        )
        status_code = response.status_code
        try:
            response_data = response.json()
        except Exception:
            response_data = {"raw_response": response.text}
    except httpx.RequestError as exc:
        status_code = 502
        response_data = {"error": f"Failed to reach agent endpoint: {str(exc)}"}

    latency_ms = int((time.perf_counter() - start_time) * 1000)

    await record_execution(
        agent_id=agent_id,
        buyer_id=buyer_id,
        api_key_id=api_key_id,
        subscription_id=subscription_id,
        status_code=status_code,
        latency_ms=latency_ms,
        cost_charged=cost_charged,
        pricing_type=agent_data["pricing_type"]
    )

    supabase.table("api_keys") \
        .update({"last_used_at": "now()"}) \
        .eq("id", api_key_id) \
        .execute()

    return JSONResponse(status_code=status_code, content=response_data)