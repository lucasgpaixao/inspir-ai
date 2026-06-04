import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  ACCEPTED_CUSTOM_IMAGE_TYPES,
  customImageExtension,
} from '@/lib/posts';

function isAdminAuthorized(password: string | null, request: Request): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (password === adminPassword) return true;

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  return !!(cronSecret && authHeader === `Bearer ${cronSecret}`);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const date = formData.get('date');
    const password = formData.get('password');
    const file = formData.get('file');

    if (typeof date !== 'string' || !date) {
      return NextResponse.json(
        { success: false, error: 'Data da postagem é obrigatória.' },
        { status: 400 }
      );
    }

    if (!isAdminAuthorized(typeof password === 'string' ? password : null, request)) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado. Senha administrativa inválida.' },
        { status: 401 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Arquivo de imagem é obrigatório.' },
        { status: 400 }
      );
    }

    if (
      !ACCEPTED_CUSTOM_IMAGE_TYPES.includes(
        file.type as (typeof ACCEPTED_CUSTOM_IMAGE_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Formato inválido. Use JPEG, PNG ou WebP.',
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const ext = customImageExtension(file.type);
    const filePath = `posts/${date}/background-custom.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from('instagram-posts')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('instagram-posts')
      .getPublicUrl(filePath);

    const { data: existing } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('post_date', date)
      .maybeSingle();

    const upsertPayload = {
      post_date: date,
      quote: existing?.quote ?? 'Sua frase aqui',
      caption: existing?.caption ?? '',
      image_url:
        existing?.image_url ??
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop',
      image_path: existing?.image_path ?? null,
      custom_image_path: filePath,
      custom_image_url: urlData.publicUrl,
      active_background_source: 'custom' as const,
      delivery_format: existing?.delivery_format ?? 'feed',
      status: existing?.status ?? 'draft',
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error: upsertError } = await supabaseAdmin
      .from('posts')
      .upsert(upsertPayload, { onConflict: 'post_date' })
      .select()
      .single();

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    return NextResponse.json({ success: true, data: saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro no upload.';
    console.error('[API upload-custom]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
