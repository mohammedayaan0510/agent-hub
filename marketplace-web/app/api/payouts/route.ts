import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET /api/payouts?seller_id=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get('seller_id');

  if (!sellerId) {
    return NextResponse.json({ error: 'Missing seller_id parameter' }, { status: 400 });
  }

  try {
    // 1. Fetch seller profile (including stripe_connect_id)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_connect_id')
      .eq('id', sellerId)
      .maybeSingle();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // 2. Fetch agents owned by seller
    const { data: sellerAgents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, slug, price_per_call')
      .eq('author_id', sellerId);

    if (agentsError) {
      return NextResponse.json({ error: agentsError.message }, { status: 500 });
    }

    const agentIds = (sellerAgents || []).map((a) => a.id);

    if (agentIds.length === 0) {
      return NextResponse.json({
        stripe_connect_id: userData?.stripe_connect_id || null,
        is_connected: !!userData?.stripe_connect_id,
        summary: { gross_revenue_usd: 0, platform_fee_usd: 0, net_earnings_usd: 0, total_executions: 0 },
        agent_breakdown: [],
      });
    }

    // 3. Fetch execution usage logs
    const { data: logs, error: logsError } = await supabase
      .from('usage_logs')
      .select('id, agent_id, cost_usd, created_at')
      .in('agent_id', agentIds);

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    const safeLogs = logs || [];
    const PLATFORM_FEE_RATE = 0.10;
    const grossRevenue = safeLogs.reduce((acc, log) => acc + Number(log.cost_usd || 0), 0);
    const platformFee = grossRevenue * PLATFORM_FEE_RATE;
    const netEarnings = grossRevenue - platformFee;

    const agentMap = new Map<string, { id: string; name: string; calls: number; revenue: number }>();
    (sellerAgents || []).forEach((agent) => {
      agentMap.set(agent.id, { id: agent.id, name: agent.name, calls: 0, revenue: 0 });
    });

    safeLogs.forEach((log) => {
      const entry = agentMap.get(log.agent_id);
      if (entry) {
        entry.calls += 1;
        entry.revenue += Number(log.cost_usd || 0);
      }
    });

    return NextResponse.json({
      stripe_connect_id: userData?.stripe_connect_id || null,
      is_connected: !!userData?.stripe_connect_id,
      summary: {
        gross_revenue_usd: grossRevenue,
        platform_fee_usd: platformFee,
        net_earnings_usd: netEarnings,
        total_executions: safeLogs.length,
      },
      agent_breakdown: Array.from(agentMap.values()),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/payouts - Connect / Disconnect Stripe Account ID
export async function POST(request: Request) {
  try {
    const { seller_id, stripe_connect_id } = await request.json();

    if (!seller_id) {
      return NextResponse.json({ error: 'Missing seller_id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('users')
      .update({ stripe_connect_id: stripe_connect_id || null })
      .eq('id', seller_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, stripe_connect_id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}