import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const createOfflineResult = () => ({
	data: null,
	error: new Error("Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
})

const createOfflineQueryBuilder = () => {
	const builder = {
		select: () => builder,
		insert: () => builder,
		update: () => builder,
		upsert: () => builder,
		delete: () => builder,
		eq: () => builder,
		in: () => builder,
		or: () => builder,
		order: () => builder,
		single: () => builder,
		maybeSingle: () => builder,
		limit: () => builder,
		then: (resolve, reject) => Promise.resolve(createOfflineResult()).then(resolve, reject),
		catch: (reject) => Promise.resolve(createOfflineResult()).catch(reject),
		finally: (onFinally) => Promise.resolve(createOfflineResult()).finally(onFinally),
	}
	return builder
}

const createOfflineSupabaseClient = () => ({
	from: () => createOfflineQueryBuilder(),
	functions: {
		invoke: async () => createOfflineResult(),
	},
})

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
	? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
	: createOfflineSupabaseClient()

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	console.warn("Supabase environment variables are missing. Running in offline mode.")
}