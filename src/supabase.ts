import { createClient } from '@supabase/supabase-js'
import { frontendEnv } from './config/env.js'

export const supabase = createClient(frontendEnv.VITE_SUPABASE_URL, frontendEnv.VITE_SUPABASE_ANON_KEY)
