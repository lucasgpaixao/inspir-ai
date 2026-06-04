import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-demo-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Auxiliar para saber se as chaves reais foram fornecidas
export const hasSupabaseKeys = (): boolean => {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder-demo-url.supabase.co'
  );
};

// Cliente público para o Supabase (seguro para build do Next.js se as variáveis estiverem vazias)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== 'undefined', // Evita falhas no servidor de renderização
  }
});

// Cliente do servidor usando a Service Role Key para operações administrativas (somente em rotas de API ou Server Components)
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY não está configurada. Operações administrativas usarão a chave anônima.');
  }
  return createClient(supabaseUrl, serviceRoleKey);
};
