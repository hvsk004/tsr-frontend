import { useEffect, useRef } from 'react';
import { DetectionResult } from '@/lib/types';

interface DetectionDisplayProps {
  src: string;
  detections: DetectionResult[];
  type: 'image' | 'video';
}

export function DetectionDisplay({ src, detections, type }: DetectionDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const media = mediaRef.current;
    if (!canvas || !media) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawDetections = () => {
      canvas.width = media.clientWidth;
      canvas.height = media.clientHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      detections.forEach((detection) => {
        const { x, y, width, height } = detection.boundingBox;
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = '#00ff00';
        ctx.font = '14px Arial';
        ctx.fillText(
          `${detection.class} ${Math.round(detection.confidence * 100)}%`,
          x,
          y - 5
        );
      });
    };

    if (type === 'video') {
      const videoElement = media as HTMLVideoElement;
      videoElement.addEventListener('play', drawDetections);
      return () => videoElement.removeEventListener('play', drawDetections);
    } else {
      const imageElement = media as HTMLImageElement;
      imageElement.onload = drawDetections;
    }
  }, [src, detections, type]);

  return (
    <div className="relative">
      {type === 'image' ? (
        <img
          ref={mediaRef as React.RefObject<HTMLImageElement>}
          src={src}
          alt="Detection"
          className="max-w-full h-auto"
        />
      ) : (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={src}
          controls
          className="max-w-full h-auto"
        />
      )}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none"
      />
    </div>
  );
}