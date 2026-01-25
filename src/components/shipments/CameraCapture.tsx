import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function CameraCapture({ onCapture, onClose, isOpen }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  }, [capturedImage, onCapture]);

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      startCamera();
    } else {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capture Driver Photo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          
          {isLoading && (
            <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          
          {!capturedImage && !isLoading && !error && (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
          
          {capturedImage && (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <img
                src={capturedImage}
                alt="Captured driver photo"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex justify-center gap-3">
            {!capturedImage && !error && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={capturePhoto} disabled={!stream || isLoading}>
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
              </>
            )}
            
            {capturedImage && (
              <>
                <Button variant="outline" onClick={retakePhoto}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={confirmPhoto}>
                  <Check className="h-4 w-4 mr-2" />
                  Use Photo
                </Button>
              </>
            )}
            
            {error && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={startCamera}>
                  Try Again
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
