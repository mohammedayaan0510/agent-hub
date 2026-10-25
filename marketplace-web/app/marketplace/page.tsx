'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Search, Bot, Sparkles, SlidersHorizontal, Star, Zap, Tag, ArrowUpRight, Loader2 } from 'lucide-react';

interface AgentListing {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price_per_call: number;
  rating: number;
  total_calls: number;
  badge?: string;
}

const FALLBACK_AGENTS: AgentListing[] = [
  {
    id: '1',
    name: 'CodeReview Pro',
    slug: 'codereview-pro',
    description: 'Automated PR analysis, security vulnerability scanning, and performance recommendations.',
    category: 'Developer Tools',
    price_per_call: 0.005,
    rating: 4.9,
    total_calls: 12400,
    badge: 'Popular',
  },
  {
    id: '2',
    name: 'DocuQuery AI',
    slug: 'docuquery-ai',
    description: 'Extract insights, table data, and structured summaries from complex PDF documents.',
    category: 'Data & Analytics',
    price_per_call: 0.002,
    rating: 4.8,
    total_calls: 8900,
  },
  {
    id: '3',
    name: 'SQL Query Optimizer',
    slug: 'sql-query-optimizer',
    description: 'Analyzes database schemas and slow queries to generate optimized SQL index strategies.',
    category: 'Developer Tools',
    price_per_call: 0.003,
    rating: 4.9,
    total_calls: 15200,
    badge: 'Top Rated',
  },
];

const CATEGORIES = [
  'All Categories',
  'Developer Tools',
  'Data & Analytics',
  'Content & Marketing',
  'Customer Support',
  'Vision & Media',
];

export default function MarketplacePage() {
  const [agents, setAgents] = useState<AgentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'priceAsc'>('popular');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadAgents() {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('agents').select('*');
        if (!error && data && data.length > 0) {
          setAgents(data);
        } else {
          setAgents(FALLBACK_AGENTS);
        }
      } catch {
        setAgents(FALLBACK_AGENTS);
      } finally {
        setLoading(false);
      }
    }
    loadAgents();
  }, [supabase]);

  const filteredAgents = useMemo(() => {
    return agents
      .filter((agent) => {
        const matchesSearch =
          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          selectedCategory === 'All Categories' || agent.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'priceAsc') return (a.price_per_call || 0) - (b.price_per_call || 0);
        return (b.total_calls || 0) - (a.total_calls || 0);
      });
  }, [agents, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AgentHub Marketplace</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-3">
          Explore AI Agents
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
          Discover, test, and integrate production-ready AI agent endpoints into your stack.
        </p>
      </div>

      {/* Search Input & Filtering Controls */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search agents by name or capability..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-zinc-400 shrink-0 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popular' | 'rating' | 'priceAsc')}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="priceAsc">Lowest Price / Call</option>
            </select>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          Loading marketplace agents...
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
          <Bot className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            No agents match your filter
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Clear your search term or select "All Categories".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((agent) => (
            <Link
              key={agent.id}
              href={`/marketplace/${agent.slug}`}
              className="group p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-indigo-500/50 transition flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  {agent.badge && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {agent.badge}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 transition flex items-center gap-1">
                  {agent.name}
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                </h3>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {agent.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1 font-medium text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    {agent.rating ?? 5.0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-indigo-500" />
                    {(agent.total_calls || 0).toLocaleString()} calls
                  </span>
                </div>

                <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-zinc-400" />${agent.price_per_call ?? 0.005}/call
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}