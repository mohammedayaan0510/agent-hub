'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Key, Plus, Trash2, Copy, Check, AlertCircle, Loader2, Play } from 'lucide-react';

interface ApiKeyItem {
  id: string;
  key_name: string;
  key_prefix: string;
  created_at: string;
}

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [keyName, setKeyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Inline test states
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const generateHash = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setKeys([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, key_name, key_prefix, created_at')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setKeys(data || []);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setCreating(true);
    setErrorMsg('');
    setNewlyCreatedKey(null);
    setTestResult(null);

    const { data: { user } } = await supabase.auth.getUser();

    const generatedKey = `ah_live_${crypto.randomUUID().replace(/-/g, '')}`;
    const keyPrefix = generatedKey.substring(0, 12);
    const keyHash = await generateHash(generatedKey);

    const payload: Record<string, unknown> = {
      key_name: keyName.trim(),
      key_prefix: keyPrefix,
      api_key: generatedKey,
      key_hash: keyHash,
    };

    if (user?.id) {
      payload.buyer_id = user.id;
    }

    const { data, error } = await supabase
      .from('api_keys')
      .insert([payload])
      .select('id, key_name, key_prefix, created_at')
      .single();

    setCreating(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setNewlyCreatedKey(generatedKey);
      setKeyName('');
      if (data) {
        setKeys((prev) => [data, ...prev]);
      } else {
        fetchKeys();
      }
    }
  };

  const handleTestKey = async (secretKey: string) => {
    setTestingKey(true);
    setTestResult(null);

    try {
      const endpoint = `${window.location.origin}/api/v1/test-key`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'x-api-key': secretKey,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setTestResult({
          success: true,
          message: `Success! Authenticated key for "${data.key_info.key_name}" (ID: ${data.key_info.key_id})`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Authentication failed.',
        });
      }
    } catch (err: unknown) {
      const errorDetail = err instanceof Error ? err.message : 'Unknown network error';
      setTestResult({
        success: false,
        message: `Failed to reach API validation endpoint: ${errorDetail}`,
      });
    } finally {
      setTestingKey(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setKeys((prev) => prev.filter((k) => k.id !== id));
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            API Keys
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Manage developer keys to authenticate AgentHub API requests
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Create New Key
        </h2>
        <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Key Name (e.g. Local Dev)"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            required
          />
          <button
            type="submit"
            disabled={creating || !keyName.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Key
              </>
            )}
          </button>
        </form>

        {newlyCreatedKey && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            <p className="text-xs font-semibold mb-1">
              Key created successfully! Copy or test it now before navigating away.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-emerald-500/30 text-xs font-mono text-zinc-900 dark:text-zinc-100 mt-2">
              <span className="truncate flex-1 font-mono select-all">{newlyCreatedKey}</span>
              
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(newlyCreatedKey, 'new_key')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition flex items-center gap-1.5 font-sans text-xs font-medium shadow-sm"
                >
                  {copiedId === 'new_key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === 'new_key' ? 'Copied!' : 'Copy Key'}
                </button>

                <button
                  type="button"
                  onClick={() => handleTestKey(newlyCreatedKey)}
                  disabled={testingKey}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition flex items-center gap-1.5 font-sans text-xs font-medium shadow-sm disabled:opacity-50"
                >
                  {testingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Test Key
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`mt-2 p-2.5 rounded-lg text-xs font-mono border ${
                  testResult.success
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                    : 'bg-red-500/20 border-red-500/40 text-red-900 dark:text-red-200'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Your Active Keys
        </h2>

        {loading ? (
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            Loading keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm">
            No API keys found. Create one above to get started.
          </div>
        ) : (
          keys.map((key) => (
            <div
              key={key.id}
              className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-4"
            >
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  {key.key_name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {key.key_prefix || 'ah_live_'}••••••••
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    Created {new Date(key.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteKey(key.id)}
                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                title="Revoke key"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}