import { createClient } from '@supabase/supabase-js'

// console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
// console.log('KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY)

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseUrl = https://vacetuhatcxknjauqdcn.supabase.co
const supabaseAnonKey = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY2V0dWhhdGN4a25qYXVxZGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTM5MDEsImV4cCI6MjA5MjAyOTkwMX0.DYIlN0gex6wqxOea-O2t6xkTBz6cVL1O0cCHje8uuNQ

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
