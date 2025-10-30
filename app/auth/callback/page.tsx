'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CallbackPage() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        // 1) Handle errors from provider (query or hash)
        const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
        const hashParams = new URLSearchParams(hash);
        const qpError = search.get('error') || search.get('error_description');
        const hpError = hashParams.get('error') || hashParams.get('error_description');
        const err = qpError || hpError;
        if (err) {
          router.replace(`/signin?error=${encodeURIComponent(err)}`);
          return;
        }

        // 2) Modern PKCE / "code" flow (OAuth or email magic link)
        const code = search.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            router.replace(`/signin?error=${encodeURIComponent(error.message)}`);
            return;
          }
          // Optional: honor redirect param (?redirectTo=/some/path)
          const redirectTo = search.get('redirectTo') || '/';
          router.replace(redirectTo);
          return;
        }

        // 3) Legacy hash-token flow (older email links)
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token') ?? '';
        if (access_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) {
            router.replace(`/signin?error=${encodeURIComponent(error.message)}`);
            return;
          }
          const redirectTo = search.get('redirectTo') || '/';
          router.replace(redirectTo);
          return;
        }

        // 4) No credentials present — absorb & nudge to signin
        router.replace('/signin?error=' + encodeURIComponent('No auth credentials found. Please sign in again.'));
      } catch (e: any) {
        router.replace('/signin?error=' + encodeURIComponent(e?.message || 'Unexpected error'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Signing you in…</h1>
      <p>You’ll be redirected automatically. If not, <a href="/signin">continue to sign in</a>.</p>
    </main>
  );
}
