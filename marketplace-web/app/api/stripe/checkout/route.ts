import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { buyerId, agentId, amountUsd } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY is missing from .env.local' },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Type-safe session payload for Stripe Checkout
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Agent Execution Compute Credits',
              description: `$${amountUsd} in pre-paid call credits`,
            },
            unit_amount: Math.round(Number(amountUsd) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: { buyerId, agentId, amountUsd: String(amountUsd) },
      success_url: `${appUrl}/?payment=success`,
      cancel_url: `${appUrl}/?payment=canceled`,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize checkout' },
      { status: 500 }
    );
  }
}