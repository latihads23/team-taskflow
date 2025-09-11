import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cqqruphhynqinioklsax.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

if (!supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
