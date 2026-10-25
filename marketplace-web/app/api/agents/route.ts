import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Fallback marketplace agents if database table is empty or offline
const FALLBACK_AGENTS = [
  {
    id: '1',
    name: 'CodeReview Pro',
    slug: 'codereview-pro',
    description: 'Automated PR analysis, security vulnerability scanning, and performance recommendations.',
    category: 'Developer Tools',
    price_per_call: 0.005,
    rating: 4.9,
    total_calls: 12400,
    badge: 'Popular',
    endpoint: '/api/v1/agents/codereview-pro',
  },
  {
    id: '2',
    name: 'DocuQuery AI',
    slug: 'docuquery-ai',
    description: 'Extract insights, table data, and structured summaries from complex PDF documents.',
    category: 'Data & Analytics',
    price_per_call: 0.002,
    rating: 4.8,
    total_calls: 8900,
    endpoint: '/api/v1/agents/docuquery-ai',
  },
  {
    id: '3',
    name: 'SQL Query Optimizer',
    slug: 'sql-query-optimizer',
    description: 'Analyzes database schemas and slow queries to generate optimized SQL index strategies.',
    category: 'Developer Tools',
    price_per_call: 0.003,
    rating: 4.9,
    total_calls: 15200,
    badge: 'Top Rated',
    endpoint: '/api/v1/agents/sql-query-optimizer',
  },
];

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check if Supabase keys exist
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables missing. Returning fallback marketplace agents.');
      return NextResponse.json({ agents: FALLBACK_AGENTS });
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Context
          }
        },
      },
    });

    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error in /api/agents:', error.message);
      return NextResponse.json({ agents: FALLBACK_AGENTS, db_error: error.message });
    }

    if (!agents || agents.length === 0) {
      return NextResponse.json({ agents: FALLBACK_AGENTS });
    }

    return NextResponse.json({ agents });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Unhandled exception in /api/agents:', message);
    return NextResponse.json({ agents: FALLBACK_AGENTS, error: message }, { status: 200 });
  }
}