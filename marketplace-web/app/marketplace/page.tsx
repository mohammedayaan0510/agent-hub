'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, Sparkles, Bot, ArrowUpRight, 
  Code2, Tag, Copy, Check, Terminal, ExternalLink 
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price_per_call: number;
  created_at: string;
}

const CATEGORIES = ['All', 'Code & Dev', 'Data & Scraping', 'Content & Copy', 'Finance & Analytics', 'Utilities'];

export default function MarketplacePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/agents', window.location.origin);
      if (selectedCategory !== 'All') url.searchParams.set('category', selectedCategory);
      if (searchQuery.trim()) url.searchParams.set('q', searchQuery.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error('Failed to load agents catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAgents();
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const copyAgentId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 text-zinc-900 dark:text-zinc-100">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-4 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AgentHub Marketplace</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
          Discover & Execute Specialized AI Agents
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base mt-3 leading-relaxed">
          Access specialized AI endpoints hosted on our gateway proxy (`:8000`). Pay per request seamlessly with unified API credits.
        </p>
      </div>

      {/* Search Bar & Category Filters */}
      <div className="max-w-4xl mx-auto mb-10 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search agents by capability, title, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                  : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Discovery Grid / Skeleton Loader */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div 
              key={n} 
              className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-20 h-5 rounded-md bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="w-3/4 h-5 rounded-md bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-2">
                <div className="w-full h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-5/6 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex justify-between items-center">
                <div className="w-24 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-16 h-7 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
          <Bot className="w-12 h-12 mx-auto text-zinc-400 mb-3" />
          <h3 className="text-base font-bold">No Agents Match Your Criteria</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Try adjusting your search filter or selecting another category above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl group-hover:scale-105 transition duration-200">
                    <Bot className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    ${Number(agent.price_per_call || 0.005).toFixed(4)} / call
                  </span>
                </div>

                <h3 className="font-bold text-base group-hover:text-indigo-500 transition">
                  {agent.name}
                </h3>
                
                <div className="flex items-center gap-1.5 my-2">
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
                    {agent.category || 'Utility'}
                  </span>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 mt-2 leading-relaxed">
                  {agent.description || 'No detailed description provided for this agent.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <button
                  onClick={() => setSelectedAgent(agent)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                >
                  <Code2 className="w-3.5 h-3.5" /> Quick Proxy Info
                </button>

                <Link
                  href="/dashboard/keys"
                  className="px-3.5 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white dark:hover:text-white transition"
                >
                  <span>Execute</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Endpoint Inspection Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-500" />
                {selectedAgent.name}
              </h3>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-xs text-zinc-400 hover:text-zinc-100 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Send requests using your buyer API key to proxy calls to this agent via `:8000`.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase">Agent ID</label>
                <div className="mt-1 flex items-center gap-2 bg-zinc-950 text-zinc-100 font-mono text-xs p-3 rounded-xl border border-zinc-800">
                  <span className="truncate flex-1">{selectedAgent.id}</span>
                  <button
                    onClick={() => copyAgentId(selectedAgent.id)}
                    className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase">Gateway Proxy Route</label>
                <div className="mt-1 bg-zinc-950 text-indigo-400 font-mono text-xs p-3 rounded-xl border border-zinc-800 truncate">
                  POST http://localhost:8000/v1/proxy/{selectedAgent.id}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href="/dashboard/keys"
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-500 transition flex items-center gap-1.5"
              >
                <span>Get API Key</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}