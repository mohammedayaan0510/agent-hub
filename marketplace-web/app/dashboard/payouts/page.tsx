'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Building2, ArrowRight, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

function PayoutsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams.get('status');

    if (status === 'success') {
      setSuccessMsg('Your bank account onboarding was completed successfully! Payouts are now enabled.');
      // Clean up URL parameters without triggering a full page reload
      router.replace('/dashboard/payouts');
    } else if (status === 'refresh') {
      setErrorMsg('The onboarding session expired or was canceled. Please click below to try connecting again.');
      router.replace('/dashboard/payouts');
    }
  }, [searchParams, router]);

  const handleConnectBankAccount = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const endpoint = '/api/v1/payouts/connect';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const rawText = await res.text();
        console.error(`Received non-JSON response from ${endpoint}:`, rawText);
        throw new Error(
          `Server returned non-JSON response (${res.status} ${res.statusText}).`
        );
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize payout connection.');
      }

      if (data.url) {
        setSuccessMsg('Redirecting to secure Stripe account setup...');
        window.location.href = data.url;
        return;
      }

      setSuccessMsg('Payout account verified!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Sellers & Payouts
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Connect your bank account or payout method to receive funds from marketplace sales
          </p>
        </div>
      </div>

      {/* Dynamic Status Notifications */}
      {errorMsg && (
        <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold block mb-0.5">Connection Notice</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Setup Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Payout Method Setup
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          Connect your bank account via Stripe Connect to automatically receive revenue from your AI agent deployments.
        </p>

        <button
          type="button"
          onClick={handleConnectBankAccount}
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition shadow-md disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting to Stripe...
            </>
          ) : errorMsg ? (
            <>
              Retry Bank Connection
              <RefreshCw className="w-4 h-4" />
            </>
          ) : (
            <>
              Connect Bank Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function PayoutsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center text-zinc-500 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          Loading Payouts...
        </div>
      }
    >
      <PayoutsContent />
    </Suspense>
  );
}