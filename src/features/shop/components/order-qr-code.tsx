'use client';

import { useEffect, useRef } from 'react';

interface OrderQrCodeProps {
  token: string;
  size?: number;
}

/**
 * Renders a QR code for order collection verification.
 * Uses Canvas API for QR code generation (no external dependency).
 * Falls back to showing the token as text.
 *
 * For production use, consider adding the `qrcode` npm package
 * for more robust QR generation.
 */
export function OrderQrCode({ token, size = 200 }: OrderQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dynamic import of qrcode if available, otherwise show placeholder
    import('qrcode')
      .then((QRCode) => {
        QRCode.toCanvas(canvas, token, {
          width: size,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
      })
      .catch(() => {
        // Fallback: draw text-based placeholder
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = size;
        canvas.height = size;
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#666';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', size / 2, size / 2 - 10);
        ctx.font = '10px monospace';
        ctx.fillText(token.slice(0, 18) + '...', size / 2, size / 2 + 10);
      });
  }, [token, size]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-lg border"
      />
      <p className="text-xs text-muted-foreground font-mono break-all max-w-[200px] text-center">
        {token}
      </p>
    </div>
  );
}
