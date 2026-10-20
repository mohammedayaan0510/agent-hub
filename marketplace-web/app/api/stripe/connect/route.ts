import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",

}as any);

export async function POST() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY environment variable." },
        { status: 500 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://your-project.vercel.app";

    // 1. Create an Express connected account
    const account = await stripe.accounts.create({
      type: "express",
    });

    // 2. Generate the Stripe Express onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/dashboard`,
      return_url: `${origin}/dashboard?stripe=connected`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err: any) {
    console.error("Stripe Connect Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to initiate Stripe onboarding." },
      { status: 500 }
    );
  }
}