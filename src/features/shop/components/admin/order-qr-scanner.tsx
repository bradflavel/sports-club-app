'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { verifyCollectionQr } from '../../services/order-service';
import { useToast } from '@/components/ui/use-toast';

interface OrderQrScannerProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
}

export function OrderQrScanner({ orgId, open, onOpenChange, onVerified }: OrderQrScannerProps) {
  const { toast } = useToast();
  const [manualToken, setManualToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannerLib, setScannerLib] = useState<unknown>(null);

  // Try to initialize camera-based QR scanner
  useEffect(() => {
    if (!open || !cameraActive) return;

    let html5QrScanner: { stop: () => Promise<void> } | null = null;

    import('html5-qrcode')
      .then(({ Html5Qrcode }) => {
        const scanner = new Html5Qrcode('qr-reader');
        html5QrScanner = scanner;

        scanner
          .start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText: string) => {
              scanner.stop().catch(() => {});
              setCameraActive(false);
              handleVerify(decodedText);
            },
            () => {}
          )
          .catch(() => {
            toast({
              title: 'Camera unavailable',
              description: 'Enter the QR token manually instead.',
              variant: 'destructive',
            });
            setCameraActive(false);
          });
      })
      .catch(() => {
        // html5-qrcode not installed, camera scanning unavailable
        setCameraActive(false);
      });

    return () => {
      html5QrScanner?.stop().catch(() => {});
    };
  }, [open, cameraActive]);

  async function handleVerify(token: string) {
    if (!token.trim()) return;
    setVerifying(true);
    setResult(null);

    const { data, error } = await verifyCollectionQr(orgId, token.trim());

    if (error) {
      setResult({ success: false, message: typeof error === 'string' ? error : (error as { message: string }).message });
    } else if (data) {
      setResult({ success: true, message: `Order ${data.order_number} marked as collected!` });
      onVerified();
    }
    setVerifying(false);
  }

  function handleClose() {
    setCameraActive(false);
    setResult(null);
    setManualToken('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Collection QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera scanner area */}
          {cameraActive && (
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
          )}

          {!cameraActive && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setCameraActive(true)}
            >
              <Camera className="h-4 w-4" />
              Open Camera Scanner
            </Button>
          )}

          {/* Manual entry */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Or enter the QR token manually:</p>
            <div className="flex gap-2">
              <Input
                placeholder="QR token"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify(manualToken)}
              />
              <Button
                onClick={() => handleVerify(manualToken)}
                disabled={verifying || !manualToken.trim()}
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
              </Button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <Card className={result.success ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'}>
              <CardContent className="flex items-center gap-3 p-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                <p className="text-sm">{result.message}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
