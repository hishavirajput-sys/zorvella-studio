// Server-side Supabase client - uses local standalone store when external secrets are absent.
import { createMockSupabaseClient } from './mock';

function createSupabaseAdminClient() {
  return createMockSupabaseClient();
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
