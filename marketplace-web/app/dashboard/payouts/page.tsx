'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Wallet, ArrowDownRight, 
  CheckCircle2, Clock, Bot, RefreshCw, Sparkles, Building2, ExternalLink 
} from 'lucide-react';

interface SellerMetrics {
  total_earnings_usd: number;
  pending_balance_usd: number;
  paid_out_usd: number;
  active_agents_count: number;
}

interface AgentRevenueItem {
  id: string;
  name: string;
  price_per_call: number;
  category: string;
}

interface PayoutRecord {
  id: string;
  amount_usd: number;
  status: 'completed' | 'pending' | 'processing';
  payout_method: string;
  created_at: string;
}

export default function RevenuePayoutsPage() {
  const [sellerId] = useState('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  const [metrics, setMetrics] = useState<SellerMetrics>({
    total_earnings_usd: 0,
    pending_balance_usd: 0,
    paid_out_usd: 0,
    active_agents_count: 0,
  });
  const [agents, setAgents] = useState<AgentRevenueItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [connectingBank, setConnectingBank] = useState(false);

  const fetchPayoutData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payouts?seller_id=${sellerId}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics || metrics);
        setAgents(data.agents || []);
        setPayouts(data.payouts || []);
      }
    } catch (err) {
      console.error('Failed to load payouts data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const handleConnectBank = async () => {
    setConnectingBank(true);
    try {
      const res = await fetch('/api/payouts/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller_id: sellerId, email: 'seller@example.com' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to connect bank account:', err);
    } finally {
      setConnectingBank(false);
    }
  };

  const handleRequestPayout = async () => {
    if (metrics.pending_balance_usd <= 0) return;
    setWithdrawing(true);

    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: sellerId,
          amount_usd: metrics.pending_balance_usd,
          payout_method: 'Stripe Direct / Bank Transfer',
        }),
      });

      if (res.ok) {
        alert('Payout request submitted successfully!');
        fetchPayoutData();
      }
    } catch (err) {
      console.error('Error requesting payout:', err);
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-zinc-900 dark:text-zinc-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            Seller Revenue & Payouts
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Track execution revenues earned from buyers calling your AI agent proxy endpoints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleConnectBank}
            disabled={connectingBank}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-2 transition shadow-sm disabled:opacity-50"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{connectingBank ? 'Connecting...' : 'Connect Bank Account'}</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            onClick={fetchPayoutData}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center gap-2 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 animate-pulse" />
          ))
        ) : (
          <>
            <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                <span>Available for Payout</span>
                <Wallet className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold mt-2 font-mono text-emerald-600 dark:text-emerald-400">
                ${metrics.pending_balance_usd.toFixed(2)}
              </div>
              <button
                onClick={handleRequestPayout}
                disabled={withdrawing || metrics.pending_balance_usd <= 0}
                className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition shadow-sm"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                {withdrawing ? 'Processing...' : 'Withdraw Earnings'}
              </button>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                <span>Total Earned</span>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-extrabold mt-2 font-mono">${metrics.total_earnings_usd.toFixed(2)}</div>
              <div className="text-[11px] text-zinc-400 mt-1">Lifetime gross execution revenue</div>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                <span>Paid Out to Date</span>
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-extrabold mt-2 font-mono">${metrics.paid_out_usd.toFixed(2)}</div>
              <div className="text-[11px] text-zinc-400 mt-1">Transferred to bank account</div>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                <span>Active Agents</span>
                <Bot className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold mt-2 font-mono">{metrics.active_agents_count}</div>
              <div className="text-[11px] text-zinc-400 mt-1">Monetized proxy endpoints</div>
            </div>
          </>
        )}
      </div>

      {/* Grid Split: Agents Breakdown & Withdrawal Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/40 shadow-sm p-6">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Monetized Agents & Pricing
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500">
              No agents listed for monetization yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-xs">
              {agents.map((ag) => (
                <div key={ag.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 font-sans">{ag.name}</span>
                    <span className="block text-[11px] text-zinc-400 font-sans mt-0.5">{ag.category || 'Utility'}</span>
                  </div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    ${Number(ag.price_per_call || 0.005).toFixed(4)} / call
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/40 shadow-sm p-6">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-indigo-500" />
            Payout & Withdrawal History
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500">
              No withdrawal history recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-xs">
              {payouts.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 font-sans">{p.payout_method}</span>
                    <span className="block text-[11px] text-zinc-400 font-sans mt-0.5">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">${Number(p.amount_usd).toFixed(2)}</span>
                    <span className="block text-[10px] text-amber-500 capitalize flex items-center gap-1 justify-end font-sans">
                      <Clock className="w-3 h-3" /> {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}