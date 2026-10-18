'use client';

import { useState } from 'react';
import { CreditCard, Zap, CheckCircle2 } from 'lucide-react';

interface TopUpModalProps {
  buyerId: string;
  agentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TopUpModal({ buyerId, agentId, isOpen, onClose }: TopUpModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(25);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId,
          agentId,
          amountUsd: selectedAmount,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to initialize checkout.');
      }
    } catch (err) {
      alert('An error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold">Buy Compute Credits</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm">✕</button>
        </div>

        <p className="text-sm text-zinc-400 mt-3">
          Select a credit package to make live API calls to this agent via our gateway proxy.
        </p>

        <div className="grid grid-cols-3 gap-3 my-6">
          {[10, 25, 50].map((amount) => (
            <button
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              className={`p-4 rounded-xl border text-center transition-all ${
                selectedAmount === amount
                  ? 'border-amber-500 bg-amber-500/10 text-white font-bold ring-2 ring-amber-500/30'
                  : 'border-zinc-800 bg-zinc-800/50 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="text-xl font-bold">${amount}</div>
              <div className="text-xs text-zinc-400 mt-1">
                {amount === 25 ? 'Most Popular' : `${amount * 1000} calls`}
              </div>
            </button>
          ))}
        </div>

        <div className="bg-zinc-800/40 p-3 rounded-lg border border-zinc-800/80 mb-6 text-xs text-zinc-400 space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Instant API key credit balance update</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <CreditCard className="h-4 w-4" />
          {loading ? 'Redirecting to Stripe...' : `Pay $${selectedAmount} with Stripe`}
        </button>
      </div>
    </div>
  );
}