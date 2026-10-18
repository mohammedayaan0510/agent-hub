'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, ArrowRight, Bot, Key, Zap, 
  Terminal, DollarSign, Check, Copy, CheckCircle2 
} from 'lucide-react';

export default function LandingPage() {
  const [copied, setCopied] = useState(false);

  const sampleCurl = `curl -X POST "http://localhost:8000/v1/proxy/ag_code_summarizer" \\
  -H "Authorization: Bearer ag_live_9f8a3c2e1d" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Summarize this repository architecture"}'`;

  const copySnippet = () => {
    navigator.clipboard.writeText(sampleCurl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Background Micro Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-6 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation AI Agent Infrastructure</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent max-w-4xl mx-auto leading-[1.15]">
          Monetize & Deploy AI Agents via High-Speed Proxy Gateways
        </h1>

        <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
          AgentHub empowers developers to publish, monetize, and execute autonomous AI agent endpoints with SHA-256 key authentication, built-in rate limits, and instant credit settlement.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/marketplace"
            className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Bot className="w-4 h-4" />
            <span>Explore Agent Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/dashboard/keys"
            className="w-full sm:w-auto px-6 py-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            <Key className="w-4 h-4 text-indigo-500" />
            <span>Get API Key</span>
          </Link>
        </div>

        {/* Key Metrics Strip */}
        <div className="mt-16 pt-10 border-t border-zinc-200/60 dark:border-zinc-800/60 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div>
            <div className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">&lt; 120ms</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Average Proxy Overhead</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">SHA-256</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Hashed Key Security</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">Sliding Window</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Redis Rate Limiting</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">100%</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Pay-Per-Call Settlement</div>
          </div>
        </div>
      </section>

      {/* Interactive Code Preview Section */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-zinc-400 ml-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                bash — proxy-gateway-execution
              </span>
            </div>

            <button
              onClick={copySnippet}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>

          <div className="p-6 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
            <pre className="text-indigo-400">{sampleCurl}</pre>
            <div className="mt-4 pt-4 border-t border-zinc-800/80 text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>HTTP/1.1 200 OK — Executed in 118ms (Cost: $0.0050 deducted)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Engineered for Agent Builders & API Buyers
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
            A unified platform for managing API keys, tracking usage metrics, and controlling rate limits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl hover:border-indigo-500/40 transition-all">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl w-fit mb-4">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">SHA-256 Key Gateway</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Generate non-recoverable hashed API keys with prefixes. Immediate validation via Fast-Path gateway proxy.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl hover:border-indigo-500/40 transition-all">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl w-fit mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Sliding Window Rate Limits</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Redis-backed ZSET rate limiters prevent endpoint abuse while returning standard `X-RateLimit-*` headers.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl hover:border-indigo-500/40 transition-all">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl w-fit mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Instant Credit Top-Up</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Transparent per-call pricing deducted automatically from buyer balances with real-time payout tracking for sellers.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-zinc-900/50 border border-indigo-500/20 text-center relative overflow-hidden">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Ready to execute specialized AI agents?</h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-3 max-w-xl mx-auto">
            Get started in seconds with developer test credits and instantly generate your SHA-256 access keys.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/marketplace"
              className="px-6 py-3 bg-white text-zinc-900 hover:bg-zinc-100 font-bold text-xs sm:text-sm rounded-xl transition shadow-lg"
            >
              Launch Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}