'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type Profile = {
  id: string;
  full_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
};

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [p, setP] = useState<Profile | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/signin?next=/account');
        return;
      }
      // load existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, city, state, country')
        .eq('id', user.id)
        .maybeSingle();
      if (error) setErr(error.message);
      setP(
        data ?? {
          id: user.id,
          full_name: user.user_metadata?.full_name ?? '',
          city: '',
          state: '',
          country: '',
        }
      );
      setLoading(false);
    })();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!p) return;
    setErr(null);
    setMsg(null);
    setSaving(true);

    const payload = {
      id: p.id,
      full_name: p.full_name?.trim() || null,
      city: p.city?.trim() || null,
      state: p.state?.trim() || null,
      country: p.country?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    setSaving(false);

    if (error) {
      setErr(error.message);
      return;
    }
    setDirty(false);
    setMsg('Saved!');
    // ensure SSR sees cookie/user immediately if page uses server comps later
    router.refresh();
  }

  const setField = (k: keyof Profile, v: string) => {
    setP(prev => (prev ? { ...prev, [k]: v } : prev));
    setDirty(true);
  };

  if (loading) {
    return <main className="container mx-auto py-10">Loading…</main>;
  }

  return (
    <main className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Account</h1>
        <Link href="/" className="text-sm underline">← Back to Home</Link>
      </div>

      <div className="mx-auto max-w-xl rounded-2xl border border-neutral-200 p-6 shadow-sm">
        {err && <p className="mb-3 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">{err}</p>}
        {msg && <p className="mb-3 rounded border border-emerald-300 bg-emerald-50 p-2 text-sm text-emerald-700">{msg}</p>}

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Full name</span>
            <input
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
              value={p?.full_name ?? ''}
              onChange={(e) => setField('full_name', e.target.value)}
              placeholder="Your name"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">City</span>
            <input
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
              value={p?.city ?? ''}
              onChange={(e) => setField('city', e.target.value)}
              placeholder="City"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">State</span>
            <input
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
              value={p?.state ?? ''}
              onChange={(e) => setField('state', e.target.value)}
              placeholder="State"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Country</span>
            <input
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
              value={p?.country ?? ''}
              onChange={(e) => setField('country', e.target.value)}
              placeholder="Country"
            />
          </label>

          <div className="col-span-full mt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !dirty}
              className="rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="rounded-md border px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
