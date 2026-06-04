'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DeliveryFormat } from '@/lib/posts';
import { StylePreset } from '@/lib/styles';

interface CanvasPostProps {
  quote: string;
  imageUrl: string;
  preset: StylePreset;
  deliveryFormat?: DeliveryFormat;
  fontSize?: number;
  lineHeight?: number;
  onComposeReady?: (dataUrl: string) => void;
}

const CANVAS_WIDTH = 1080;

function getCanvasDimensions(format: DeliveryFormat) {
  if (format === 'story') {
    return { width: CANVAS_WIDTH, height: 1920 };
  }
  return { width: CANVAS_WIDTH, height: CANVAS_WIDTH };
}

export const CanvasPost: React.FC<CanvasPostProps> = ({
  quote,
  imageUrl,
  preset,
  deliveryFormat = 'feed',
  fontSize = 48,
  lineHeight = 1.4,
  onComposeReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!imageUrl) return;

    setImageLoaded(false);
    setError(null);

    const img = new Image();
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
        drawCanvas(null);
      }
    };

    return () => {
      active = false;
    };
  }, [quote, imageUrl, preset, fontSize, lineHeight, deliveryFormat]);

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

  const resolveFontSize = (
    ctx: CanvasRenderingContext2D,
    lines: string[],
    baseFontSize: number,
    canvasHeight: number,
    isStory: boolean
  ) => {
    let size = baseFontSize;
    const minSize = isStory ? 28 : 24;
    const maxTextHeight = isStory ? canvasHeight * 0.45 : canvasHeight * 0.55;

    while (size > minSize) {
      const totalHeight = lines.length * size * lineHeight;
      if (totalHeight <= maxTextHeight) break;
      size -= 2;
    }

    return size;
  };

  const drawCanvas = (img: HTMLImageElement | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getCanvasDimensions(deliveryFormat);
    const isStory = deliveryFormat === 'story';
    canvas.width = width;
    canvas.height = height;

    if (img) {
      const scale = Math.max(width / img.width, height / img.height);
      const x = (width - img.width * scale) / 2;
      const y = (height - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#111827');
      bgGrad.addColorStop(1, '#1f2937');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    if (preset.gradientOverlay) {
      const overlayGrad = ctx.createRadialGradient(
        width / 2,
        height * (isStory ? 0.42 : 0.5),
        100,
        width / 2,
        height * (isStory ? 0.42 : 0.5),
        Math.max(width, height) * 0.7
      );
      overlayGrad.addColorStop(0, `rgba(0, 0, 0, ${preset.overlayOpacity - 0.15})`);
      overlayGrad.addColorStop(1, `rgba(0, 0, 0, ${preset.overlayOpacity + 0.15})`);
      ctx.fillStyle = overlayGrad;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = `rgba(0, 0, 0, ${preset.overlayOpacity})`;
      ctx.fillRect(0, 0, width, height);
    }

    const weightName =
      preset.fontWeight === 'italic' ? 'italic normal' : preset.fontWeight;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let processedText = quote;
    if (preset.textCase === 'uppercase') {
      processedText = quote.toUpperCase();
    } else if (preset.textCase === 'capitalize') {
      processedText = quote.replace(/\b\w/g, (c) => c.toUpperCase());
    }

    const maxWidth = width - 160;
    ctx.font = `${weightName} ${fontSize}px ${preset.fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    let lines = wrapText(ctx, processedText, maxWidth);
    const effectiveFontSize = resolveFontSize(
      ctx,
      lines,
      fontSize,
      height,
      isStory
    );

    ctx.font = `${weightName} ${effectiveFontSize}px ${preset.fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    lines = wrapText(ctx, processedText, maxWidth);

    ctx.fillStyle = preset.fontColor;
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

    const totalTextHeight = lines.length * effectiveFontSize * lineHeight;
    const centerY = isStory ? height * 0.4 : height / 2;
    let startY = centerY - totalTextHeight / 2 + (effectiveFontSize * lineHeight) / 2;

    lines.forEach((line) => {
      ctx.fillText(line, width / 2, startY);
      startY += effectiveFontSize * lineHeight;
    });

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.font = '300 16px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const watermarkY = isStory ? height - 140 : height - 50;
    ctx.fillText('gerado com @inspirai', width / 2, watermarkY);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      onComposeReady?.(dataUrl);
    } catch (err) {
      console.warn('CORS evitou a exportação do Canvas como data URL:', err);
    }
  };

  const isStory = deliveryFormat === 'story';
  const dimensionLabel = isStory ? '1080×1920px (Story)' : '1080×1080px (Feed)';

  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full max-w-full">
      <div
        className={`relative shrink-0 overflow-hidden border-2 border-[var(--inspir-ink,#14110f)] bg-[var(--inspir-ink,#14110f)] mx-auto ${
          isStory
            ? 'aspect-[9/16] h-[min(52vh,420px)] w-auto max-w-full'
            : 'aspect-square w-full max-w-[min(100%,320px)]'
        }`}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-contain"
        />
        {!imageLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-neutral-400">Montando arte...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute bottom-2 left-2 right-2 bg-destructive/90 text-destructive-foreground p-2 rounded text-xs text-center">
            {error}
          </div>
        )}
      </div>
      <p className="text-[10px] text-[var(--inspir-muted,#7a7266)] text-center max-w-[280px]">
        Exportação em alta resolução ({dimensionLabel})
      </p>
    </div>
  );
};
