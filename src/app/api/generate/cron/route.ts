import { NextResponse } from 'next/server';
import { generatePost } from '@/lib/generator';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // 1. Verificar cabeçalho de autorização do Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Em produção, garante que apenas o Vercel Cron possa chamar esta URL
    if (process.env.NODE_ENV === 'production' && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Não autorizado. Chamada de Cron inválida.' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 2. Calcular a data de hoje (ou amanhã, dependendo de quando quer antecipar)
    // Vamos gerar para o dia de hoje se ainda não existir
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    console.log(`[Cron] Iniciando verificação de post automático para a data: ${dateStr}`);

    // 3. Verificar se já existe um post para hoje no banco de dados
    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('post_date', dateStr)
      .maybeSingle();

    if (fetchError) {
      console.error('[Cron] Erro ao verificar post existente:', fetchError);
      return NextResponse.json({ error: 'Erro ao acessar banco de dados.' }, { status: 500 });
    }

    if (existingPost) {
      console.log(`[Cron] Post para ${dateStr} já existe. Ignorando geração automática.`);
      return NextResponse.json({
        success: true,
        message: `Post para ${dateStr} já existe. Nenhuma ação necessária.`,
      });
    }

    // 4. Se não existir, gerar automaticamente usando as configurações globais do banco
    console.log(`[Cron] Post para ${dateStr} não encontrado. Disparando geração automática por IA...`);
    const result = await generatePost(dateStr);

    return NextResponse.json({
      success: true,
      message: `Post automático gerado com sucesso para ${dateStr}!`,
      data: result,
    });
  } catch (error: any) {
    console.error('[Cron] Erro crítico na execução do Cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro interno no Cron Job.',
      },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
