'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function CallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    (async () => {
      const code = sp.get('code');
      const err = sp.get('error_description') || sp.get('error');

      if (err) {
        router.replace(`/signin?error=${encodeURIComponent(err)}`);
        return;
      }

      // A) Code (PKCE) flow
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace(`/signin?error=${encodeURIComponent(error.message)}`);
          return;
        }
        router.replace('/');
        router.refresh();
        return;
      }

      // B) Hash-token (magic link) flow
      const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
      const hsp = new URLSearchParams(hash);
      const access_token = hsp.get('access_token');
      const refresh_token = hsp.get('refresh_token') ?? '';
      const hashErr = hsp.get('error_description');

      if (hashErr) {
        router.replace(`/signin?error=${encodeURIComponent(hashErr)}`);
        return;
      }

      if (access_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) {
          router.replace(`/signin?error=${encodeURIComponent(error.message)}`);
          return;
        }
        // clean hash then go home
        window.history.replaceState({}, '', window.location.pathname);
        router.replace('/');
        router.refresh();
        return;
      }

      // C) Nothing usable → go home
      router.replace('/');
      router.refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <main className="container py-10">Signing you in…</main>;
}
