'use client';

import { useState, useEffect } from 'react';
import { 
  Key, Plus, Copy, Check, Trash2, Power, AlertTriangle, 
  ShieldCheck, Code2, CheckCircle2, X 
} from 'lucide-react';

interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export default function ApiKeysPage() {
  const [buyerId] = useState('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyName, setKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick-start code snippet generator state
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'node'>('curl');
  const [selectedAgentId] = useState('YOUR_AGENT_ID');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/keys?buyer_id=${buyerId}`);

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.error(`API Error (${res.status} ${res.statusText}):`, errBody);
        setKeys([]);
        return;
      }

      const data = await res.json();
      if (data.keys) {
        setKeys(data.keys);
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_id: buyerId, name: keyName }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to create key');
        return;
      }

      const data = await res.json();
      if (data.raw_key) {
        setNewRawKey(data.raw_key);
        setKeyName('');
        fetchKeys();
        showToast('New API key generated successfully!');
      }
    } catch (err) {
      console.error('Error creating key:', err);
    } finally {
      setCreating(false);
    }
  };

  const toggleKeyStatus = async (keyId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_id: keyId, is_active: !currentStatus }),
      });

      if (res.ok) {
        setKeys(keys.map((k) => (k.id === keyId ? { ...k, is_active: !currentStatus } : k)));
        showToast(currentStatus ? 'API Key revoked' : 'API Key activated');
      }
    } catch (err) {
      console.error('Failed to toggle key:', err);
    }
  };

  const deleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? Any integration using it will stop working.')) {
      return;
    }

    try {
      const res = await fetch(`/api/keys?key_id=${keyId}`, { method: 'DELETE' });
      if (res.ok) {
        setKeys(keys.filter((k) => k.id !== keyId));
        showToast('API Key permanently deleted');
      }
    } catch (err) {
      console.error('Failed to delete key:', err);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  const activeKeyForSnippet = newRawKey || 'ag_live_YOUR_API_KEY';

  const getSnippet = () => {
    if (activeTab === 'curl') {
      return `curl.exe -X POST "http://localhost:8000/v1/proxy/${selectedAgentId}" \\
  -H "Authorization: Bearer ${activeKeyForSnippet}" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Hello from AgentHub buyer test!"}'`;
    }
    if (activeTab === 'python') {
      return `import httpx

url = "http://localhost:8000/v1/proxy/${selectedAgentId}"
headers = {
    "Authorization": "Bearer ${activeKeyForSnippet}",
    "Content-Type": "application/json"
}
payload = {"prompt": "Hello from AgentHub buyer test!"}

response = httpx.post(url, headers=headers, json=payload)
print(response.json())`;
    }
    return `const response = await fetch('http://localhost:8000/v1/proxy/${selectedAgentId}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${activeKeyForSnippet}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ prompt: 'Hello from AgentHub buyer test!' }),
});

const data = await response.json();
console.log(data);`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 text-zinc-900 dark:text-zinc-100 relative">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold rounded-2xl shadow-2xl border border-zinc-800 dark:border-zinc-200 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-zinc-400 hover:text-white dark:hover:text-zinc-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-6 h-6 text-indigo-500" />
            API Key Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Generate and manage SHA-256 hashed keys for calling AI agents via Gateway Proxy (`:8000`).
          </p>
        </div>
      </div>

      {/* Secret Key Banner Modal */}
      {newRawKey && (
        <div className="mb-8 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="w-full">
              <h3 className="font-semibold text-amber-500 text-sm">Save your secret API Key!</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                For security reasons, this key will <strong>never be shown again</strong>.
              </p>
              <div className="mt-3 flex items-center gap-2 bg-zinc-950 text-zinc-100 font-mono text-xs p-3 rounded-xl border border-zinc-800">
                <span className="truncate flex-1 font-medium">{newRawKey}</span>
                <button
                  type="button"
                  onClick={() => copyText(newRawKey, 'API Key')}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1 text-xs transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Key</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setNewRawKey(null)}
                className="mt-3 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
              >
                I have saved this key securely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Key Form */}
      <form onSubmit={handleCreateKey} className="mb-8 p-4 bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row gap-3 shadow-sm">
        <input
          type="text"
          placeholder="Key Label (e.g. Production Backend, Local Dev)"
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
          required
          className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <button
          type="submit"
          disabled={creating}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 shrink-0 shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          {creating ? 'Generating...' : 'Generate Key'}
        </button>
      </form>

      {/* Keys Table / Skeletal Loader */}
      <div className="mb-10 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/40 shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Active Credentials ({keys.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-zinc-100 dark:bg-zinc-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500">
            No API keys created yet. Generate one above to access the gateway proxy.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
            {keys.map((k) => (
              <div key={k.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{k.name}</span>
                    {k.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                        Revoked
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono mt-1">
                    {k.key_prefix}••••••••••••••••••••••••
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    Created: {new Date(k.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleKeyStatus(k.id, k.is_active)}
                    title={k.is_active ? 'Revoke Key' : 'Activate Key'}
                    className={`p-2 rounded-xl border transition ${
                      k.is_active
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-200'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteKey(k.id)}
                    title="Delete Key"
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Integration Code Snippets */}
      <div className="p-6 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-500" />
              Quick-Start Integration Snippet
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Copy-paste execution calls directly into your frontend or backend application code.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('curl')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'curl' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500'
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'python' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500'
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveTab('node')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'node' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500'
              }`}
            >
              Node.js
            </button>
          </div>
        </div>

        <div className="relative bg-zinc-950 text-zinc-100 font-mono text-xs p-4 rounded-xl border border-zinc-800 overflow-x-auto">
          <button
            onClick={() => copyText(getSnippet(), 'Code Snippet')}
            className="absolute top-3 right-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center gap-1.5 text-xs transition border border-zinc-700 font-sans font-medium"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Snippet</span>
          </button>
          <pre className="pr-28 whitespace-pre-wrap leading-relaxed">{getSnippet()}</pre>
        </div>
      </div>
    </div>
  );
}