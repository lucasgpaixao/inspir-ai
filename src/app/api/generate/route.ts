import { NextResponse } from 'next/server';
import { generatePost } from '@/lib/generator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, styleId, niche, password } = body;

    // Verificar se a data foi fornecida
    if (!date) {
      return NextResponse.json(
        { error: 'A data do post é obrigatória (formato YYYY-MM-DD).' },
        { status: 400 }
      );
    }

    // Validar senha de administrador simples (Single Tenant)
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (password !== adminPassword) {
      // Verificar se a requisição veio de um Cron Job verificado
      const authHeader = request.headers.get('authorization');
      const cronSecret = process.env.CRON_SECRET;
      
      const isCronVerified = cronSecret && authHeader === `Bearer ${cronSecret}`;
      
      if (!isCronVerified) {
        return NextResponse.json(
          { error: 'Não autorizado. Senha administrativa inválida.' },
          { status: 401 }
        );
      }
    }

    const result = await generatePost(date, styleId, niche);

    return NextResponse.json({
      success: true,
      message: `Post gerado com sucesso para ${date}`,
      data: result,
    });
  } catch (error: any) {
    console.error('[API Gerar] Erro na rota:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro desconhecido na geração do post.',
      },
      { status: 500 }
    );
  }
}
