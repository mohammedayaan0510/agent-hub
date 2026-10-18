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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const query = searchParams.get('q');

    const supabase = getSupabaseClient();

    let dbQuery = supabase
      .from('agents')
      .select('id, name, slug, description, category, price_per_call, author_id, created_at')
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      dbQuery = dbQuery.eq('category', category);
    }

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      return NextResponse.json({ error: error.message, agents: [] }, { status: 500 });
    }

    return NextResponse.json({ agents: data || [] }, { status: 200 });
  } catch (err: any) {
    console.error('API /api/agents GET Error:', err.message);
    return NextResponse.json({ error: err.message, agents: [] }, { status: 500 });
  }
}