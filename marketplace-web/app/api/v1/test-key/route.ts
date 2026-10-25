import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const apiKeyHeader = request.headers.get('x-api-key');

  const rawKey = apiKeyHeader || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

  if (!rawKey) {
    return NextResponse.json(
      { error: 'Missing API key. Provide x-api-key header or Authorization: Bearer <key>' },
      { status: 401 }
    );
  }

  const keyHash = await hashApiKey(rawKey);

  const { data: keyRecord, error } = await supabase
    .from('api_keys')
    .select('id, key_name, buyer_id, created_at')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (error || !keyRecord) {
    return NextResponse.json(
      { error: 'Invalid or revoked API key' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: 'API Key authenticated successfully!',
    key_info: {
      key_id: keyRecord.id,
      key_name: keyRecord.key_name,
      created_at: keyRecord.created_at,
    },
  });
}