'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, Plus, CheckCircle2, 
  History, RefreshCw, Zap, ShieldCheck 
} from 'lucide-react';

interface Transaction {
  id: string;
  amount_usd: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

const PRESET_AMOUNTS = [10, 25, 50, 100];

export default function BillingPage() {
  const [buyerId] = useState('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing?buyer_id=${buyerId}`);
      if (res.ok) {
        const data = await res.json();
        setBalance(data.credits_usd || 0);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleTopUp = async () => {
    const amountToTopUp = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (isNaN(amountToTopUp) || amountToTopUp <= 0) return;

    setProcessing(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_id: buyerId,
          amount_usd: amountToTopUp,
          payment_method: 'Stripe Direct / Card',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBalance(data.new_balance_usd);
        setCustomAmount('');
        fetchBillingData();
      }
    } catch (err) {
      console.error('Error topping up credits:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 text-zinc-900 dark:text-zinc-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-500" />
            Billing & Credit Balance
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Purchase execution credits used for executing agent calls via the FastAPI gateway proxy.
          </p>
        </div>

        <button
          onClick={fetchBillingData}
          disabled={loading}
          className="px-4 py-2 text-xs font-semibold bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center gap-2 self-start sm:self-auto transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Balance Card */}
        <div className="p-6 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Current Available Balance</span>
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-4xl font-extrabold mt-3 font-mono text-emerald-600 dark:text-emerald-400">
              ${balance.toFixed(2)}
            </div>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Deducted automatically per call based on individual agent rates (e.g., $0.0050/call).
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 text-[11px] text-zinc-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>Secured via SHA-256 key gateway routing</span>
          </div>
        </div>

        {/* Top Up Selector */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-indigo-500" />
            Add Execution Credits
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`py-3 px-4 rounded-xl border font-mono text-sm font-bold transition ${
                    selectedAmount === amt && !customAmount
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                      : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                  }`}
                >
                  ${amt}.00
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Custom Amount ($)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
              />
              <button
                onClick={handleTopUp}
                disabled={processing}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition disabled:opacity-50 shrink-0 shadow-md shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                {processing ? 'Processing...' : 'Add Balance'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Purchase History Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/40 shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-500" />
            Top-Up Transaction History
          </h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-500">
            No top-up transactions recorded yet. Add credits above to fund your API calls.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-xs">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 px-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition">
                <div>
                  <span className="font-bold font-sans text-zinc-900 dark:text-zinc-100">{tx.payment_method}</span>
                  <span className="block text-[11px] text-zinc-400 font-sans mt-0.5">
                    {new Date(tx.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+${Number(tx.amount_usd).toFixed(2)}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> {tx.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}