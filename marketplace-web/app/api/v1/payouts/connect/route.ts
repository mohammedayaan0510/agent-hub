import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
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
              // Ignore inside Server Components
            }
          },
        },
      }
    );

    // 1. Authenticate user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to connect a bank account.' },
        { status: 401 }
      );
    }

    // 2. Query existing seller profile
    const { data: profile } = await supabase
      .from('sellers')
      .select('id, stripe_account_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        {
          error:
            'STRIPE_SECRET_KEY is missing from .env.local. Add your key to generate real Stripe onboarding URLs.',
        },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    let accountId = profile?.stripe_account_id;

    // 3. Create Connected Account via Stripe v2 Endpoint if missing
    if (!accountId) {
      const v2Response = await fetch('https://api.stripe.com/v2/core/accounts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Stripe-Version': '2026-09-30.endive',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_email: user.email,
          identity: {
            country: 'US',
          },
          dashboard: 'express',
          defaults: {
            responsibilities: {
              fees_collector: 'application',
              losses_collector: 'application',
            },
          },
          configuration: {
            merchant: {
              capabilities: {
                card_payments: { requested: true },
              },
            },
            recipient: {
              capabilities: {
                stripe_balance: {
                  stripe_transfers: { requested: true },
                },
              },
            },
          },
        }),
      });

      const v2Data = await v2Response.json();

      if (!v2Response.ok) {
        throw new Error(
          v2Data.error?.message ||
            `Failed to create v2 Connected Account (${v2Response.status})`
        );
      }

      accountId = v2Data.id;

      // Persist stripe_account_id to Supabase
      await supabase
        .from('sellers')
        .upsert({ user_id: user.id, stripe_account_id: accountId });
    }

    // 4. Generate Stripe Account Onboarding Link
    const origin = request.nextUrl.origin;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/payouts?status=refresh`,
      return_url: `${origin}/dashboard/payouts?status=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { error: `Stripe Connect Error: ${message}` },
      { status: 500 }
    );
  }
}