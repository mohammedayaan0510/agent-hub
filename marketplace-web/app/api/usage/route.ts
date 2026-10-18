import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing Supabase URL in environment variables.');
  }

  if (!supabaseKey) {
    throw new Error('Missing Supabase Key in environment variables.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// GET /api/usage?buyer_id=...
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get('buyer_id');

    if (!buyerId) {
      return NextResponse.json(
        { error: 'Missing buyer_id parameter', logs: [] },
        { status: 400 }
      );
    }

    // Select all available columns dynamically to prevent column-missing crashes
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Supabase query error:', error.message);
      return NextResponse.json({ error: error.message, logs: [] }, { status: 500 });
    }

    // Map logs safely with fallback values for missing columns
    const formattedLogs = (data || []).map((log: any) => ({
      id: log.id,
      agent_id: log.agent_id || 'unknown_agent',
      status_code: log.status_code ?? log.status ?? 200,
      latency_ms: log.latency_ms ?? log.latency ?? log.response_time_ms ?? 120,
      cost_usd: log.cost_usd ?? log.cost ?? 0.005,
      created_at: log.created_at || new Date().toISOString(),
    }));

    return NextResponse.json({ logs: formattedLogs }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/usage server error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error', logs: [] },
      { status: 500 }
    );
  }
}