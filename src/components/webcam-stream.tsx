import { useEffect, useRef, useState } from 'react';
import { wsClient } from '@/lib/websocket';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { DetectionResult } from '@/lib/types';

interface WebcamStreamProps {
  onDetections: (detections: DetectionResult[]) => void;
}

export function WebcamStream({ onDetections }: WebcamStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWebcam = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });

      if (videoRef.current && canvasRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        
        wsClient.connect((data) => {
          if (data.type === 'detection') {
            onDetections(data.data as DetectionResult[]);
          } else if (data.type === 'error') {
            setError(data.data as string);
          }
        });

        videoRef.current.onloadedmetadata = () => {
          sendFrames();
        };
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      setError('Could not access webcam. Please ensure you have granted camera permissions.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
      wsClient.disconnect();
      setError(null);
    }
  };

  const sendFrames = () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    context.drawImage(videoRef.current, 0, 0);
    const frame = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
    wsClient.sendFrame(frame);

    if (isStreaming) {
      requestAnimationFrame(sendFrames);
    }
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={isStreaming ? stopWebcam : startWebcam}
          variant={isStreaming ? 'destructive' : 'default'}
        >
          {isStreaming ? (
            <>
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="relative rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full rounded-lg"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}