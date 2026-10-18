import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  
  // Prefers Service Role Key for elevated backend tasks, falls back to Anon Key
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing Supabase URL in environment variables.');
  }

  if (!supabaseKey) {
    throw new Error('Missing Supabase Key (Service Role or Anon) in environment variables.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// GET /api/keys?buyer_id=...
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get('buyer_id');

    if (!buyerId) {
      return NextResponse.json(
        { error: 'Missing buyer_id parameter', keys: [] },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, is_active, created_at, last_used_at')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error.message);
      return NextResponse.json({ error: error.message, keys: [] }, { status: 500 });
    }

    return NextResponse.json({ keys: data || [] }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/keys server error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error', keys: [] },
      { status: 500 }
    );
  }
}