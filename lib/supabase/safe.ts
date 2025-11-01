// lib/supabase/safe.ts
import { supabaseServer } from "./server";

type SB = ReturnType<typeof supabaseServer>;
type AnyBuilder = any;

export function sbSafe(sb: SB) {
  return {
    from<T extends string>(table: T): AnyBuilder {
      return (sb as any).from(table);
    },
    rpc(name: string, args?: Record<string, any>) {
      return (sb as any).rpc(name, args);
    },
    auth: (sb as any).auth,
  } as any;
}
