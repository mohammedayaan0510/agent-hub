import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/billing?buyer_id=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get('buyer_id');

    if (!buyerId) {
      return NextResponse.json({ error: 'Missing buyer_id parameter' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Query buyer profile balance
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, credits_usd')
      .eq('id', buyerId)
      .single();

    if (profileErr) {
      console.error('Failed to fetch profile credits:', profileErr.message);
    }

    // Query credit purchase transactions history
    const { data: transactions, error: txErr } = await supabase
      .from('credit_transactions')
      .select('id, amount_usd, payment_status, payment_method, created_at')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (txErr) {
      console.error('Failed to fetch transactions:', txErr.message);
    }

    return NextResponse.json(
      {
        credits_usd: profile?.credits_usd ?? 25.00,
        transactions: transactions || [],
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('GET /api/billing error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/billing - Top Up Credit Balance
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { buyer_id, amount_usd, payment_method } = await request.json();

    if (!buyer_id || !amount_usd || amount_usd <= 0) {
      return NextResponse.json({ error: 'Valid buyer_id and positive amount_usd required' }, { status: 400 });
    }

    // 1. Record credit transaction
    const { data: tx, error: txError } = await supabase
      .from('credit_transactions')
      .insert({
        buyer_id,
        amount_usd,
        payment_method: payment_method || 'Credit Card (Stripe Mock)',
        payment_status: 'succeeded',
      })
      .select()
      .single();

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    // 2. Fetch current balance and increment
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_usd')
      .eq('id', buyer_id)
      .single();

    const currentBalance = profile?.credits_usd || 0;
    const newBalance = Number(currentBalance) + Number(amount_usd);

    await supabase
      .from('profiles')
      .update({ credits_usd: newBalance })
      .eq('id', buyer_id);

    return NextResponse.json({ success: true, new_balance_usd: newBalance, transaction: tx }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}