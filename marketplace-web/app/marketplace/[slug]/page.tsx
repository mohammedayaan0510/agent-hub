'use client';

import { useState, use, Suspense } from 'react';
import Link from 'next/link';
import {
  Bot,
  Star,
  Zap,
  Tag,
  ArrowLeft,
  Terminal,
  Code2,
  Copy,
  Check,
  Play,
  Loader2,
  Key,
  ShieldCheck,
} from 'lucide-react';

interface AgentDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  pricePerCall: number;
  rating: number;
  totalCalls: number;
  badge?: string;
  endpoint: string;
  defaultPayload: string;
}

const AGENTS_DATABASE: Record<string, AgentDetail> = {
  'codereview-pro': {
    id: '1',
    name: 'CodeReview Pro',
    slug: 'codereview-pro',
    description:
      'Automated PR analysis, security vulnerability scanning, and performance recommendations for TypeScript, C++, and Python.',
    category: 'Developer Tools',
    pricePerCall: 0.005,
    rating: 4.9,
    totalCalls: 12400,
    badge: 'Popular',
    endpoint: '/api/v1/agents/codereview-pro',
    defaultPayload: JSON.stringify(
      {
        language: 'cpp',
        code: 'int main() { int* ptr = new int(10); return 0; }',
      },
      null,
      2
    ),
  },
  'docuquery-ai': {
    id: '2',
    name: 'DocuQuery AI',
    slug: 'docuquery-ai',
    description:
      'Extract insights, table data, and structured summaries from complex PDF documents and legal contracts.',
    category: 'Data & Analytics',
    pricePerCall: 0.002,
    rating: 4.8,
    totalCalls: 8900,
    endpoint: '/api/v1/agents/docuquery-ai',
    defaultPayload: JSON.stringify(
      {
        document_url: 'https://example.com/sample.pdf',
        extract_fields: ['total_amount', 'invoice_date', 'vendor_name'],
      },
      null,
      2
    ),
  },
  'sql-query-optimizer': {
    id: '3',
    name: 'SQL Query Optimizer',
    slug: 'sql-query-optimizer',
    description:
      'Analyzes database schemas and slow queries to generate optimized SQL index strategies.',
    category: 'Developer Tools',
    pricePerCall: 0.003,
    rating: 4.9,
    totalCalls: 15200,
    badge: 'Top Rated',
    endpoint: '/api/v1/agents/sql-query-optimizer',
    defaultPayload: JSON.stringify(
      {
        query: 'SELECT * FROM users WHERE email = "user@example.com"',
      },
      null,
      2
    ),
  },
};

function AgentDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const agentSlug = resolvedParams.slug;

  const agent = AGENTS_DATABASE[agentSlug] || {
    id: 'demo',
    name: agentSlug.replace(/-/g, ' ').toUpperCase(),
    slug: agentSlug,
    description: 'Specialized AI agent endpoint configured for API execution on AgentHub Marketplace.',
    category: 'Developer Tools',
    pricePerCall: 0.005,
    rating: 4.8,
    totalCalls: 10500,
    endpoint: `/api/v1/agents/${agentSlug}`,
    defaultPayload: JSON.stringify({ prompt: 'Execute agent task', max_tokens: 256 }, null, 2),
  };

  const [activeTab, setActiveTab] = useState<'playground' | 'snippets'>('playground');
  const [apiKey, setApiKey] = useState('');
  const [requestBody, setRequestBody] = useState(agent.defaultPayload);
  const [executing, setExecuting] = useState(false);
  const [responseOutput, setResponseOutput] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'javascript' | 'python'>('curl');

  const handleExecutePlayground = async () => {
    setExecuting(true);
    setResponseOutput(null);
    setResponseStatus(null);

    try {
      let parsedJson: Record<string, unknown> = {};
      try {
        parsedJson = JSON.parse(requestBody);
      } catch {
        throw new Error('Invalid JSON format in Request Payload window.');
      }

      await new Promise((res) => setTimeout(res, 600));

      const mockResponse = {
        success: true,
        agent: agent.name,
        timestamp: new Date().toISOString(),
        execution_time_ms: 128,
        result: {
          status: 'completed',
          analysis: 'Analysis complete. Execution successful.',
          input_received: parsedJson,
        },
      };

      setResponseStatus(200);
      setResponseOutput(JSON.stringify(mockResponse, null, 2));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Execution failed';
      setResponseStatus(400);
      setResponseOutput(JSON.stringify({ error: errorMsg }, null, 2));
    } finally {
      setExecuting(false);
    }
  };

  const getCodeSnippet = () => {
    const key = apiKey.trim() || 'ah_live_your_api_key_here';
    if (selectedLanguage === 'curl') {
      return `curl -X POST "https://agenthub.dev${agent.endpoint}" \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '${requestBody.replace(/\n/g, '')}'`;
    }

    if (selectedLanguage === 'javascript') {
      return `const response = await fetch('https://agenthub.dev${agent.endpoint}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${key}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(${requestBody}),
});

const data = await response.json();
console.log(data);`;
    }

    return `import requests

url = "https://agenthub.dev${agent.endpoint}"
headers = {
    "Authorization": "Bearer ${key}",
    "Content-Type": "application/json"
}
payload = ${requestBody}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-md">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {agent.name}
              </h1>
              {agent.badge && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {agent.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
              {agent.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
          <div className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-center">
            <span className="text-zinc-400 block text-[10px] uppercase">Rating</span>
            <span className="font-bold text-amber-500 flex items-center gap-1 justify-center mt-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              {agent.rating}
            </span>
          </div>

          <div className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-center">
            <span className="text-zinc-400 block text-[10px] uppercase">Calls</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1 justify-center mt-0.5">
              <Zap className="w-3.5 h-3.5 text-indigo-500" />
              {agent.totalCalls.toLocaleString()}
            </span>
          </div>

          <div className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-center">
            <span className="text-zinc-400 block text-[10px] uppercase">Price</span>
            <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100 flex items-center gap-1 justify-center mt-0.5">
              <Tag className="w-3.5 h-3.5 text-zinc-400" />${agent.pricePerCall}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('playground')}
          className={`pb-3 px-1 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'playground'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Terminal className="w-4 h-4" />
          API Playground
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('snippets')}
          className={`pb-3 px-1 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'snippets'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Code Snippets
        </button>
      </div>

      {activeTab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-500" />
                  API Key Authentication
                </span>
                <Link
                  href="/dashboard/keys"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-normal text-xs"
                >
                  Manage Keys
                </Link>
              </label>
              <input
                type="password"
                placeholder="Paste ah_live_... key to run live call"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                  POST {agent.endpoint}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">application/json</span>
              </div>
              <textarea
                rows={8}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-950 text-emerald-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
              />

              <button
                type="button"
                onClick={handleExecutePlayground}
                disabled={executing}
                className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {executing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executing Request...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Execute Playground Test
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Response Console
                </span>
                {responseStatus && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      responseStatus === 200
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}
                  >
                    STATUS {responseStatus}
                  </span>
                )}
              </div>

              {responseOutput ? (
                <pre className="p-4 rounded-xl bg-zinc-950 text-zinc-200 font-mono text-xs overflow-x-auto max-h-[320px] leading-relaxed">
                  {responseOutput}
                </pre>
              ) : (
                <div className="p-12 text-center text-zinc-400 dark:text-zinc-500 text-xs flex flex-col items-center justify-center gap-2 h-[280px]">
                  <ShieldCheck className="w-8 h-8 opacity-40" />
                  <span>Click "Execute Playground Test" to view real-time response data</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-zinc-400 text-center mt-4">
              Requests executed via playground consume test quota credits.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'snippets' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              {(['curl', 'javascript', 'python'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition ${
                    selectedLanguage === lang
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg transition text-xs font-medium flex items-center gap-1.5"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied Snippet!' : 'Copy Code'}
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
            {getCodeSnippet()}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-12 text-center text-zinc-500 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          Loading Agent Details...
        </div>
      }
    >
      <AgentDetailContent params={params} />
    </Suspense>
  );
}