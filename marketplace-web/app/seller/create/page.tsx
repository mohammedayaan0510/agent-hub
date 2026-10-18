'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Bot, ArrowLeft, CheckCircle, Sparkles, DollarSign, Globe } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_per_call: '0.02',
    endpoint_url: '',
    category: 'Developer Tools',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Option A: Omitting seller_id completely for public/anon submission
      const { data, error } = await supabase
        .from('agents')
        .insert({
          name: formData.name,
          description: formData.description,
          price_per_call: parseFloat(formData.price_per_call),
          endpoint_url: formData.endpoint_url,
          category: formData.category,
        })
        .select();

      if (error) {
        console.error('Supabase Insert Error:', error);
        throw error;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      alert(`Supabase Error: ${err.message || 'Check table RLS policies'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Link>

        {/* Header */}
        <div className="border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-amber-500" /> List a New AI Agent
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Connect your API endpoint to the Gateway Proxy and start earning payouts per execution call.
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold">
            <CheckCircle className="h-5 w-5" /> Agent listed successfully! Redirecting to marketplace...
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/60 border border-zinc-800 p-8 rounded-2xl">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Bot className="h-4 w-4 text-amber-400" /> Agent Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Smart Code Auditor"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Description & Capabilities
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe what your agent does, input formats, and expected output..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-400" /> Price Per Execution Call (USD)
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                required
                placeholder="0.02"
                value={formData.price_per_call}
                onChange={(e) => setFormData({ ...formData, price_per_call: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Developer Tools">Developer Tools</option>
                <option value="Finance & Data">Finance & Data</option>
                <option value="Web Scraping">Web Scraping</option>
                <option value="Content & Creative">Content & Creative</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-4 w-4 text-amber-400" /> Agent API Endpoint URL
            </label>
            <input
              type="url"
              required
              placeholder="https://api.yourdomain.com/v1/agent/run"
              value={formData.endpoint_url}
              onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono text-sm"
            />
            <p className="text-xs text-zinc-500">
              The FastAPI Proxy Gateway routes authorized buyer requests directly to this URL.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Publishing Agent...' : 'Publish Agent to Marketplace'}
          </button>
        </form>
      </div>
    </div>
  );
}