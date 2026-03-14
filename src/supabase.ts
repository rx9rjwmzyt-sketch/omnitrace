import { createClient } from '@supabase/supabase-js'

// On force la lecture sécurisée
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🚨 LE DÉTECTEUR DE MENSONGE (On affiche ce que l'ordi lit vraiment)
console.log("👉 URL Supabase lue :", supabaseUrl);
console.log("👉 Clé Supabase lue :", supabaseAnonKey ? "Clé détectée !" : "CLÉ VIDE !");

// Sécurité anti-crash : Si c'est vide, on met un faux lien pour éviter l'écran blanc fatal
const safeUrl = supabaseUrl || 'https://wvcdrxnpztccpdcumgpy.supabase.co';
const safeKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Y2RyeG5wenRjY3BkY3VtZ3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzg0NTcsImV4cCI6MjA4ODgxNDQ1N30.FLvNdhfNByth7s18st4S0IutQZnmHb2HezI3llJCq_s';

export const supabase = createClient(safeUrl, safeKey)