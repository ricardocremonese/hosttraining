import { createClient } from '@supabase/supabase-js';

let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
} else {
  console.warn('⚠ Supabase não configurado no server. Preencha SUPABASE_SERVICE_KEY no .env');
}

export { supabase };
