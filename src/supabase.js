import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

const offlineResult = { data: null, error: { message: 'Supabase not configured' } }

function createOfflineQuery() {
  const result = Promise.resolve(offlineResult)
  const handler = {
    get(_target, prop) {
      if (prop === 'then') return result.then.bind(result)
      if (prop === 'catch') return result.catch.bind(result)
      if (prop === 'finally') return result.finally.bind(result)
      return () => new Proxy({}, handler)
    },
  }
  return new Proxy({}, handler)
}

function createOfflineClient() {
  const noopSubscription = { unsubscribe: () => {} }
  return {
    from: () => createOfflineQuery(),
    channel: () => ({
      on: () => ({
        subscribe: () => noopSubscription,
      }),
    }),
    functions: {
      invoke: () => Promise.resolve(offlineResult),
    },
    removeChannel: () => {},
  }
}

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createOfflineClient()

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase is not configured. Running in local-only mode. ' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local for cloud sync.'
  )
}
