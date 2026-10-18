[ User / Client Application ]
                │
                │ HTTPS (X-API-Key)
                ▼
  ┌───────────────────────────┐
  │   Next.js 14 Frontend     │  (Hosted on Vercel)
  │   - Auth & Dashboards     │
  └─────────────┬─────────────┘
                │
                │ API Gateway Requests
                ▼
  ┌───────────────────────────┐
  │   FastAPI Proxy Gateway   │  (Hosted on Render)
  │   - CORS Middleware       │
  └──────┬──────────────┬─────┘
         │              │
         │ Rate Limits  │ Auth & Telemetry
         ▼              ▼
  ┌────────────┐  ┌───────────────────────────┐
  │  Upstash   │  │   Supabase Postgres DB    │
  │   Redis    │  │   - RLS Secured Tables    │
  └────────────┘  │   - Auth Trigger Functions│
                  └───────────────────────────┘
Stack Components
Frontend: Next.js (App Router), React, Tailwind CSS, Supabase Auth (@supabase/ssr). Deployed on Vercel.

API Gateway: FastAPI (Python 3.10+), Uvicorn, Python Redis client, Supabase Python SDK. Deployed on Render.

Database & Auth: Supabase PostgreSQL with Row Level Security (RLS) policies, foreign key cascades, and automated PL/pgSQL triggers.

Rate Limiting: Upstash Redis (Sliding-window counter with local memory fallback).

✨ Features
Automated Profile Onboarding: Database trigger automatically provisions user profiles with a 100-credit starting balance upon signup.

API Key Lifecycle Management: Generation, hashing, activation, and deletion of gateway keys per buyer (buyer_id).

High-Performance API Gateway: Intercepts traffic at /v1/proxy, validates API keys against Supabase, and logs invocation telemetry.

Sliding-Window Rate Limiting: Enforces request quotas using Redis to protect downstream services against DDoS and abuse.

Granular Database Security: Row Level Security (RLS) policies enforce buyer isolation on public clients while allowing service-role overrides for gateway execution.

📁 Repository Structure
Marketplace/
├── gateway/                    # FastAPI Backend Proxy Service (Render)
│   ├── main.py                 # Core application code, CORS, and proxy routes
│   └── requirements.txt        # Python package dependencies
├── marketplace-web/            # Next.js Full-Stack Application (Vercel)
│   ├── app/                    # Next.js App Router pages and components
│   ├── public/                 # Static assets
│   └── package.json            # Node.js dependencies
└── README.md                   # Project documentation

 🚀 Production Deployment
Gateway (Render)
Root Directory: gateway

Build Command: pip install -r requirements.txt

Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT

Environment Variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REDIS_URL, ALLOWED_ORIGINS

Frontend (Vercel)
Framework Preset: Next.js

Environment Variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_GATEWAY_URL
