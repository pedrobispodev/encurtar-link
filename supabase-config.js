/**
 * ============================================
 * CONFIGURAÇÃO DO SUPABASE
 * ============================================
 *
 * COMO OBTER SUAS CHAVES:
 * 1. Acesse https://supabase.com e crie uma conta gratuita
 * 2. Crie um novo projeto (New Project)
 * 3. Vá em Settings > API
 * 4. Copie a "Project URL" e a "anon public key"
 * 5. Cole os valores abaixo
 *
 * IMPORTANTE: Nunca compartilhe sua "service_role key" publicamente.
 * Use apenas a "anon key" no frontend.
 */

const SUPABASE_URL = 'https://drthikrvrhhnrsahogzd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydGhpa3J2cmhobnJzYWhvZ3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxOTI1MjksImV4cCI6MjEwNzc2ODUyOX0.4H3H9iULRO3UllocD1uR3HMCqboMPGXOZoCOh_tGHUU';

// Inicializa o cliente Supabase globalmente
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
