'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, Clock, AlertTriangle, CheckCircle2, 
  RefreshCw, DollarSign, Bot, ShieldCheck, Search 
} from 'lucide-react';

interface UsageLog {
  id: string;
  agent_id: string;
  status_code: number;
  latency_ms: number;
  cost_usd: number;
  created_at: string;
}

export default function UsageLogsPage() {
  const [buyerId] = useState('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUsageData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/usage?buyer_id=${buyerId}`);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error(`API Error (${res.status} ${res.statusText}):`, errText);
        setErrorMessage(`HTTP ${res.status}: ${res.statusText}`);
        setLogs([]);
        return;
      }

      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      console.error('Failed to load usage data:', err);
      setErrorMessage(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, []);

  // Filter logs by agent ID search
  const filteredLogs = logs.filter((log) =>
    log.agent_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute summary stats
  const totalCalls = logs.length;
  const successfulCalls = logs.filter((l) => l.status_code >= 200 && l.status_code < 300).length;
  const rateLimitedCalls = logs.filter((l) => l.status_code === 429).length;
  const totalCost = logs.reduce((acc, l) => acc + Number(l.cost_usd || 0), 0);
  const avgLatency =
    logs.length > 0 ? Math.round(logs.reduce((acc, l) => acc + l.latency_ms, 0) / logs.length) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-zinc-900 dark:text-zinc-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-500" />
            Execution Logs & Analytics
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Real-time proxy routing telemetry, response status codes, and per-call credit cost audit trail.
          </p>
        </div>

        <button
          onClick={fetchUsageData}
          disabled={loading}
          className="px-4 py-2 text-xs font-semibold bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center gap-2 self-start sm:self-auto transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <strong className="font-semibold">Unable to fetch usage logs:</strong> {errorMessage}
          </div>
        </div>
      )}

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center justify-between">
            <span>Total Calls</span>
            <Bot className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold mt-2 font-mono">{totalCalls}</div>
          <div className="text-[11px] text-zinc-400 mt-1">{successfulCalls} successful (2xx)</div>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center justify-between">
            <span>Average Latency</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold mt-2 font-mono">{avgLatency} ms</div>
          <div className="text-[11px] text-zinc-400 mt-1">Gateway to agent pipeline</div>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center justify-between">
            <span>Rate Limited</span>
            <ShieldCheck className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-extrabold mt-2 font-mono text-red-500">{rateLimitedCalls}</div>
          <div className="text-[11px] text-zinc-400 mt-1">429 HTTP responses</div>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center justify-between">
            <span>Total Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold mt-2 font-mono text-emerald-600 dark:text-emerald-400">
            ${totalCost.toFixed(4)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Deducted from buyer credits</div>
        </div>
      </div>

      {/* Logs Table Section */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/40 shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            Execution Telemetry Stream
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter by Agent ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            {searchTerm ? 'No logs match your filter criteria.' : 'No proxy execution logs recorded yet. Call an agent endpoint via http://localhost:8000/v1/proxy/... to see live data.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-sans text-[10px]">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Agent Target</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Latency</th>
                  <th className="py-3 px-6 text-right">Deducted Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-6 text-zinc-500 font-sans">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-6 font-bold text-zinc-900 dark:text-zinc-100">
                      {log.agent_id}
                    </td>
                    <td className="py-3 px-6">
                      {log.status_code >= 200 && log.status_code < 300 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-sans">
                          <CheckCircle2 className="w-3 h-3" /> {log.status_code} OK
                        </span>
                      ) : log.status_code === 429 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 font-sans">
                          <ShieldCheck className="w-3 h-3" /> 429 Rate Limit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 font-sans">
                          <AlertTriangle className="w-3 h-3" /> {log.status_code} Error
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-zinc-600 dark:text-zinc-400">
                      {log.latency_ms} ms
                    </td>
                    <td className="py-3 px-6 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ${Number(log.cost_usd || 0).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}