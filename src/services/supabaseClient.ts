import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://pkcjdhxwyjgldkciplvs.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_LWWe_L1vDv-DCAL-NeYmcQ_nz0chcUE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

