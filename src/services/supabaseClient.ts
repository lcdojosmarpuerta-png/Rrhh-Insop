import { createClient } from '@supabase/supabase-js';

// Credenciales de respaldo (fallback) proporcionadas para funcionamiento inmediato en AI Studio
const FALLBACK_SUPABASE_URL = 'https://koeqtwkbkpzdsuxhjjhz.supabase.co/rest/v1/';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_0oAEeNpREktpj7mH5y-nXw_-cFL8hDt';

const rawSupabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ||
  FALLBACK_SUPABASE_URL;

// El cliente oficial @supabase/supabase-js requiere la URL base del proyecto (sin /rest/v1/ al final,
// ya que el SDK añade /rest/v1 automáticamente a cada consulta PostgREST).
export const SUPABASE_PROJECT_URL = rawSupabaseUrl
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
