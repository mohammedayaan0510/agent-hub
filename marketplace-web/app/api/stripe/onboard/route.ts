import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY is missing from .env.local' },
        { status: 500 }
      );
    }

    // 1. Create Connected Account using Accounts v2
    const account = await stripe.v2.core.accounts.create({
      contact_email: email || 'seller@example.com',
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
            card_payments: {
              requested: true,
            },
          },
        },
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: {
                requested: true,
              },
            },
          },
        },
      },
    });

    // 2. Generate Account Link for hosted onboarding flow
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/?status=refresh`,
      return_url: `${appUrl}/?status=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Stripe Onboard Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate onboarding link' },
      { status: 500 }
    );
  }
}