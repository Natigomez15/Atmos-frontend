import { createClient } from "@supabase/supabase-js"

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || ""
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

const clienteSupabaseDeshabilitado = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithPassword: async () => ({
      data: null,
      error: {
        message: "Supabase no esta configurado en este despliegue.",
      },
    }),
    signOut: async () => ({ error: null }),
  },
}

export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnon)

export const supabase = supabaseConfigurado
  ? createClient(supabaseUrl, supabaseAnon)
  : clienteSupabaseDeshabilitado
