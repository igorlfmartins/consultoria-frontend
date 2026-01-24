import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vvndogbmygllhpxjeuwm.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bmRvZ2JteWdsbGhweGpldXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMDYxNTgsImV4cCI6MjA4NDc4MjE1OH0.QTI8M466PnxmVB5GvlDJv41uJRy7PS4c_vii-HUz57U'

if (!supabaseKey) {
  console.warn('VITE_SUPABASE_ANON_KEY not set.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
