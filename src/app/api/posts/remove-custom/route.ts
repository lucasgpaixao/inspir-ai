import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

function isAdminAuthorized(password: string | null, request: Request): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (password === adminPassword) return true;

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  return !!(cronSecret && authHeader === `Bearer ${cronSecret}`);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, password } = body;

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Data da postagem é obrigatória.' },
        { status: 400 }
      );
    }

    if (!isAdminAuthorized(password ?? null, request)) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado. Senha administrativa inválida.' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('post_date', date)
      .maybeSingle();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Postagem não encontrada.' },
        { status: 404 }
      );
    }

    if (existing.custom_image_path) {
      await supabaseAdmin.storage
        .from('instagram-posts')
        .remove([existing.custom_image_path]);
    }

    const activeBackgroundSource =
      existing.active_background_source === 'custom' ? 'ai' : existing.active_background_source;

    const { data: saved, error: updateError } = await supabaseAdmin
      .from('posts')
      .update({
        custom_image_path: null,
        custom_image_url: null,
        active_background_source: activeBackgroundSource,
        updated_at: new Date().toISOString(),
      })
      .eq('post_date', date)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ success: true, data: saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao remover foto.';
    console.error('[API remove-custom]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
