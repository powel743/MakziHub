import { createClient } from '@supabase/supabase-js'
import { env } from './env'
import ws from 'ws'

// The 'ws' constructor type (typeof WebSocket) isn't assignable to realtime-js's
// WebSocketLikeConstructor type. Cast to satisfy the type checker; the value is
// the correct WebSocket implementation for Node at runtime.
const wsTransport = ws as unknown as undefined

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  realtime: { transport: wsTransport },
})

export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: wsTransport },
  }
)
