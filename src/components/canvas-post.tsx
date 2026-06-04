'use client';

import React, { useEffect, useRef, useState } from 'react';
import { StylePreset } from '@/lib/styles';

interface CanvasPostProps {
  quote: string;
  imageUrl: string;
  preset: StylePreset;
  fontSize?: number; // Permite ajuste dinâmico se necessário
  lineHeight?: number;
  onComposeReady?: (dataUrl: string) => void;
}

export const CanvasPost: React.FC<CanvasPostProps> = ({
  quote,
  imageUrl,
  preset,
  fontSize = 48,
  lineHeight = 1.4,
  onComposeReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Efeito para carregar a imagem e desenhar no Canvas
  useEffect(() => {
    let active = true;
    if (!imageUrl) return;

    setImageLoaded(false);
    setError(null);

    const img = new Image();
    // Permitir carregar imagens de outros domínios (como Supabase Storage ou OpenAI) no Canvas
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      if (active) {
        setImageLoaded(true);
        drawCanvas(img);
      }
    };

    img.onerror = () => {
      if (active) {
        console.error('Erro ao carregar a imagem de fundo no Canvas:', imageUrl);
        setError('Não foi possível carregar a imagem de fundo original.');
        // Desenha apenas com cor de fundo em caso de erro para não travar totalmente o app
        drawCanvas(null);
      }
    };

    return () => {
      active = false;
    };
  }, [quote, imageUrl, preset, fontSize, lineHeight]);

  // Função para quebrar texto em múltiplas linhas de acordo com a largura limite
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  const drawCanvas = (img: HTMLImageElement | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Tamanho padrão feed do Instagram (1:1 de alta qualidade)
    const size = 1080;
    canvas.width = size;
    canvas.height = size;

    // 1. Desenhar fundo (Imagem ou Gradiente de Fallback)
    if (img) {
      // Ajustar imagem para preencher proporcionalmente (object-fit cover)
      const scale = Math.max(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    } else {
      // Caso a imagem falhe, cria um gradiente sofisticado
      const bgGrad = ctx.createLinearGradient(0, 0, size, size);
      bgGrad.addColorStop(0, '#111827');
      bgGrad.addColorStop(1, '#1f2937');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);
    }

    // 2. Desenhar Camada de Escurecimento (Overlay) para legibilidade do texto
    if (preset.gradientOverlay) {
      // Gradiente radial ou linear focado no centro
      const overlayGrad = ctx.createRadialGradient(
        size / 2,
        size / 2,
        100,
        size / 2,
        size / 2,
        size * 0.7
      );
      overlayGrad.addColorStop(0, `rgba(0, 0, 0, ${preset.overlayOpacity - 0.15})`);
      overlayGrad.addColorStop(1, `rgba(0, 0, 0, ${preset.overlayOpacity + 0.15})`);
      ctx.fillStyle = overlayGrad;
      ctx.fillRect(0, 0, size, size);
    } else {
      // Overlay sólido de cor preta com opacidade
      ctx.fillStyle = `rgba(0, 0, 0, ${preset.overlayOpacity})`;
      ctx.fillRect(0, 0, size, size);
    }

    // 3. Formatar e desenhar o Texto (Frase)
    // Definir estilos de fonte baseado no preset
    const weightName = preset.fontWeight === 'italic' ? 'italic normal' : preset.fontWeight;
    ctx.font = `${weightName} ${fontSize}px ${preset.fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = preset.fontColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Aplicar Sombra do Texto
    if (preset.textShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Processar caixa de texto (Upper/Normal/Capitalize)
    let processedText = quote;
    if (preset.textCase === 'uppercase') {
      processedText = quote.toUpperCase();
    } else if (preset.textCase === 'capitalize') {
      processedText = quote.replace(/\b\w/g, (c) => c.toUpperCase());
    }

    // Margem interna para evitar encostar nas bordas (80px de margem)
    const maxWidth = size - 160;
    const lines = wrapText(ctx, processedText, maxWidth);

    // Calcular altura total ocupada pelas linhas para centralizar perfeitamente no eixo Y
    const totalTextHeight = lines.length * fontSize * lineHeight;
    let startY = (size - totalTextHeight) / 2 + (fontSize * lineHeight) / 2;

    // Desenhar cada linha
    lines.forEach((line) => {
      ctx.fillText(line, size / 2, startY);
      startY += fontSize * lineHeight;
    });

    // 4. Detalhe de Marca D'água Opcional ("InspirAI" ou nome do usuário nas bordas)
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.font = '300 16px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('gerado com @inspirai', size / 2, size - 50);

    // Notificar componente pai que o Canvas está montado e exportar PNG
    try {
      const dataUrl = canvas.toDataURL('image/png');
      onComposeReady?.(dataUrl);
    } catch (err) {
      console.warn('CORS evitou a exportação do Canvas como data URL:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="relative overflow-hidden rounded-lg border shadow-xl bg-neutral-900 aspect-square w-full max-w-[400px]">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover block"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        {!imageLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-neutral-400">Montando post...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute bottom-2 left-2 right-2 bg-destructive/90 text-destructive-foreground p-2 rounded text-xs text-center">
            {error}
          </div>
        )}
      </div>
      <p className="text-[10px] text-neutral-500 italic">
        * Post de Feed (1080x1080px) em alta resolução pronto para baixar.
      </p>
    </div>
  );
};
