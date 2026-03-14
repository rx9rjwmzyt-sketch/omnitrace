import { createClient } from '@supabase/supabase-js'

// TEST NUCLÉAIRE : On colle directement les valeurs entre les guillemets simples (quotes)
const supabaseUrl = 'https://wvcdrxnpztccpdcumgpy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Y2RyeG5wenRjY3BkY3VtZ3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzg0NTcsImV4cCI6MjA4ODgxNDQ1N30.FLvNdhfNByth7s18st4S0IutQZnmHb2HezI3llJCq_s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)