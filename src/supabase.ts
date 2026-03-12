import { createClient } from '@supabase/supabase-js';

// On récupère les clés du coffre-fort (Vite utilise import.meta.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// On crée et on exporte le câble de connexion
export const supabase = createClient(supabaseUrl, supabaseKey);