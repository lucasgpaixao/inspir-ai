import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { getSupabaseAdmin } from './supabase';
import { STYLES_PRESETS } from './styles';

// Schema para a geração estruturada via GPT
const postSchema = z.object({
  quote: z.string().describe('Uma frase inspiradora, profunda, curta e de altíssimo impacto em português (máximo 15 palavras) para ser escrita em um post de Instagram. Deve estar de acordo com o nicho especificado.'),
  caption: z.string().describe('Legenda completa e formatada em português para o post do Instagram. Deve incluir espaços, ganchos de engajamento, hashtags relevantes e emojis.'),
  imageDallePrompt: z.string().describe('Um prompt em inglês extremamente detalhado e descritivo para gerar uma imagem conceitual/abstrata de fundo que harmonize e represente o sentimento ou metáfora da frase gerada, sem conter rostos humanos, pessoas em foco direto, ou qualquer tipo de texto ou letras.')
});

export interface GeneratePostResult {
  post_date: string;
  quote: string;
  caption: string;
  image_url: string;
  image_path: string;
  status: 'ready' | 'draft';
}

/**
 * Função principal para gerar um post completo de IA para uma data específica.
 */
export async function generatePost(
  dateStr: string,
  styleId?: string,
  nicheOverride?: string
): Promise<GeneratePostResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada nas variáveis de ambiente.');
  }

  // 1. Obter configurações atuais
  const { data: dbSettings } = await supabaseAdmin
    .from('settings')
    .select('*')
    .single();

  const finalNiche = nicheOverride || dbSettings?.niche || 'Desenvolvimento Pessoal';
  const finalStyleId = styleId || dbSettings?.style_preset || 'minimalist';
  const preset = STYLES_PRESETS[finalStyleId] || STYLES_PRESETS.minimalist;

  console.log(`[Gerador] Iniciando geração para data: ${dateStr}. Nicho: "${finalNiche}", Estilo: "${preset.name}"`);

  // 2. Gerar Frase, Legenda e Prompt de Imagem usando GPT-4o-mini
  const systemPrompt = `Você é um diretor de arte e redator especialista em Instagram de alto crescimento.
Seu trabalho é criar posts virais com frases motivacionais, reflexivas ou conceituais.
O nicho da conta é: "${finalNiche}".
O estilo visual desejado é: "${preset.name}".
As frases devem ser curtas (máximo 15 palavras), profundas, memoráveis e fáceis de ler rapidamente no feed. Evite clichês óbvios.

Ao criar o prompt para o DALL-E, combine estas diretrizes:
- Estilo do preset: "${preset.dallePrompt}"
- Contexto: Crie uma metáfora visual abstrata ou artística para representar a frase.
- REGRAS CRÍTICAS DO DALL-E: Absolutamente nenhum texto, letras, logos ou marcas na imagem. Sem rostos de pessoas detalhados ou centralizados (mantenha abstrato ou silhueta distante se houver elemento humano). Foque em texturas premium, luz dramática e atmosfera conceitual de estúdio.`;

  const { object: generatedContent } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: postSchema,
    system: systemPrompt,
    prompt: `Gere o post perfeito de Instagram para o dia ${dateStr} no nicho "${finalNiche}".`,
  });

  // 3. Montar prompt final do DALL-E misturando estilo e conceito do texto
  const finalDallePrompt = `${preset.dallePrompt} Mood/Concept: ${generatedContent.imageDallePrompt}. Clean background, highly aesthetic, high-end photography, ultra realistic texture, no text, no words, no letters.`;
  console.log(`[Gerador] Prompt DALL-E gerado: ${finalDallePrompt}`);

  // 4. Chamar API de imagens (gpt-image-1) para gerar a imagem
  console.log('[Gerador] Solicitando imagem ao gpt-image-1...');
  const dalleRes = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: finalDallePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
    }),
  });

  if (!dalleRes.ok) {
    const errorBody = await dalleRes.text();
    console.error(`[Gerador] Erro na API de imagens:`, errorBody);
    throw new Error(`Erro ao gerar imagem: ${dalleRes.statusText} - ${errorBody}`);
  }

  const dalleData = await dalleRes.json();
  // gpt-image-1 sempre retorna a imagem em base64 (b64_json)
  const b64Image = dalleData.data?.[0]?.b64_json;

  if (!b64Image) {
    throw new Error('A API de imagens não retornou nenhuma imagem.');
  }

  console.log('[Gerador] Imagem gerada com sucesso. Processando...');

  // 5. Converter base64 para buffer
  const buffer = Buffer.from(b64Image, 'base64');
  // URL de fallback (data URI) caso o upload ao Storage falhe
  const dalleImageUrl = `data:image/png;base64,${b64Image}`;

  // 6. Fazer upload para o Supabase Storage
  console.log('[Gerador] Fazendo upload para o Supabase Storage...');
  const filePath = `posts/${dateStr}/background.png`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('instagram-posts')
    .upload(filePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadError) {
    console.error('[Gerador] Erro ao fazer upload para o Storage:', uploadError);
    // Nota: Se der erro de bucket inexistente ou permissão, vamos salvar apenas a URL direta do DALL-E (temporária por 1h)
    // para não travar totalmente o desenvolvimento inicial.
    console.warn('[Gerador] Salvando com URL direta temporária devido a erro de Storage.');
  }

  // Obter URL pública do arquivo no Supabase Storage
  const { data: urlData } = supabaseAdmin.storage
    .from('instagram-posts')
    .getPublicUrl(filePath);

  const finalPublicUrl = uploadError ? dalleImageUrl : urlData.publicUrl;

  // 7. Salvar ou Atualizar no Banco de Dados
  console.log('[Gerador] Salvando postagem no banco de dados...');
  const postData = {
    post_date: dateStr,
    quote: generatedContent.quote,
    caption: generatedContent.caption,
    image_path: uploadError ? null : filePath,
    image_url: finalPublicUrl,
    status: 'ready',
    updated_at: new Date().toISOString()
  };

  const { error: upsertError } = await supabaseAdmin
    .from('posts')
    .upsert(postData, { onConflict: 'post_date' });

  if (upsertError) {
    throw new Error(`Erro ao salvar postagem no banco de dados: ${upsertError.message}`);
  }

  console.log(`[Gerador] Geração e salvamento concluídos para ${dateStr}!`);

  return {
    post_date: dateStr,
    quote: generatedContent.quote,
    caption: generatedContent.caption,
    image_url: finalPublicUrl,
    image_path: uploadError ? '' : filePath,
    status: 'ready'
  };
}
