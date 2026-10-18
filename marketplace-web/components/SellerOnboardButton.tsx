'use client';

import { useState } from 'react';
import { Building2, ArrowRight } from 'lucide-react';

interface SellerOnboardButtonProps {
  userId: string;
  email: string;
}

export default function SellerOnboardButton({ userId, email }: SellerOnboardButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleOnboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start onboarding.');
      }
    } catch (err) {
      alert('An error occurred starting onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleOnboard}
      disabled={loading}
      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
    >
      <Building2 className="h-4 w-4" />
      {loading ? 'Loading Stripe...' : 'Connect Bank Account'}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}