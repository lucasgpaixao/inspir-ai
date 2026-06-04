export interface StylePreset {
  id: string;
  name: string;
  description: string;
  dallePrompt: string; // Instruções adicionais para a geração da imagem de fundo
  fontFamily: string; // Nome da fonte para renderizar
  fontWeight: string;
  fontColor: string;
  textCase: 'uppercase' | 'normal' | 'capitalize';
  overlayOpacity: number; // Opacidade da camada preta por cima da imagem (0 a 1)
  gradientOverlay?: boolean; // Se deve aplicar um degradê de escurecimento
  textShadow?: string; // Sombra do texto
}

export const STYLES_PRESETS: Record<string, StylePreset> = {
  minimalist: {
    id: 'minimalist',
    name: 'Minimalista Moderno',
    description: 'Estética clean, fundos conceituais e suaves, foco total no respiro e na mensagem.',
    dallePrompt: 'Abstract minimalist background with neutral warm tones, soft organic shadows, clean lines, high-end design, studio lighting, no text, no human faces.',
    fontFamily: 'sans-serif', // Fallback nativo
    fontWeight: '300',
    fontColor: '#FFFFFF',
    textCase: 'uppercase',
    overlayOpacity: 0.35,
    gradientOverlay: true,
    textShadow: '0px 2px 10px rgba(0,0,0,0.2)'
  },
  classic: {
    id: 'classic',
    name: 'Clássico Executivo',
    description: 'Elegância tradicional, fundos urbanos, arquitetura clássica e fontes serifadas de luxo.',
    dallePrompt: 'Elegant background of modern minimalist architecture, marble textures, dark deep blue and gold undertones, professional premium look, no text, no human faces.',
    fontFamily: 'serif',
    fontWeight: 'normal',
    fontColor: '#F5F5F0',
    textCase: 'normal',
    overlayOpacity: 0.4,
    gradientOverlay: true,
    textShadow: '2px 2px 8px rgba(0,0,0,0.5)'
  },
  organic: {
    id: 'organic',
    name: 'Natureza Orgânica',
    description: 'Tons terrosos, texturas naturais, folhas e luz do sol suave de fim de tarde.',
    dallePrompt: 'Cozy background with earth tones, soft organic textures like linen, clay, dried flowers, sunlight filtering through leaves, serene aesthetic, no text, no human faces.',
    fontFamily: 'serif',
    fontWeight: 'italic',
    fontColor: '#FFFFFF',
    textCase: 'normal',
    overlayOpacity: 0.3,
    gradientOverlay: true,
    textShadow: '1px 1px 6px rgba(0,0,0,0.3)'
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Neon Vibrante',
    description: 'Fundos escuros, luzes neon contrastantes e visual super moderno e tecnológico.',
    dallePrompt: 'Futuristic abstract cyberpunk background, dark moody synthwave aesthetic, blue and hot pink neon glows, dark concrete texture, no text, no human faces.',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    fontColor: '#00FFFF',
    textCase: 'uppercase',
    overlayOpacity: 0.5,
    gradientOverlay: false,
    textShadow: '0 0 10px #FF00FF, 0 0 2px #000000'
  },
  bold: {
    id: 'bold',
    name: 'Impacto Audaz',
    description: 'Fontes pesadas e fortes contrastes de cores para parar o feed e capturar a atenção.',
    dallePrompt: 'High-contrast graphic background, dark gray concrete or metal texture, strong yellow accents, geometric shadows, bold composition, no text, no human faces.',
    fontFamily: 'sans-serif',
    fontWeight: '900',
    fontColor: '#FFFF00',
    textCase: 'uppercase',
    overlayOpacity: 0.45,
    gradientOverlay: true,
    textShadow: '3px 3px 0px #000000'
  }
};
