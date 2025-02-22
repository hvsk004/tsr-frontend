import { useEffect, useRef, useState } from 'react';
import { DetectionResult } from '@/lib/types';

interface DetectionDisplayProps {
  src: string;
  detections: DetectionResult[];
  type: 'image' | 'video';
}

export function DetectionDisplay({ src, detections, type }: DetectionDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !src) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const img = new Image();
    
    img.onload = () => {
      // Calculate dimensions to maintain aspect ratio
      const containerWidth = container.clientWidth;
      const scale = Math.min(1, containerWidth / img.width);
      
      const width = Math.floor(img.width * scale);
      const height = Math.floor(img.height * scale);
      
      // Update canvas dimensions if they've changed
      if (canvas.width !== width || canvas.height !== height) {
        setDimensions({ width, height });
        canvas.width = width;
        canvas.height = height;
      }

      // Clear previous frame
      context.clearRect(0, 0, width, height);
      
      // Draw new frame
      context.drawImage(img, 0, 0, width, height);

      // Draw detections if any
      if (detections && detections.length > 0) {
        // Scale detection coordinates based on canvas size
        const scaleX = width / img.width;
        const scaleY = height / img.height;

        context.strokeStyle = '#ff0000';
        context.lineWidth = 2;
        context.font = '14px Arial';

        detections.forEach(detection => {
          const { x, y, width: boxWidth, height: boxHeight } = detection.boundingBox;
          
          // Scale the bounding box
          const scaledX = x * scaleX;
          const scaledY = y * scaleY;
          const scaledWidth = boxWidth * scaleX;
          const scaledHeight = boxHeight * scaleY;

          // Draw bounding box
          context.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
          
          // Draw label with confidence
          const label = `${detection.class} (${Math.round(detection.confidence * 100)}%)`;
          const textY = scaledY > 20 ? scaledY - 5 : scaledY + scaledHeight + 20;
          
          // Add background to text for better visibility
          const metrics = context.measureText(label);
          context.fillStyle = 'rgba(0, 0, 0, 0.6)';
          context.fillRect(scaledX, textY - 14, metrics.width, 18);
          
          context.fillStyle = '#ffffff';
          context.fillText(label, scaledX, textY);
        });
      }
    };

    img.src = src;

    // Cleanup
    return () => {
      img.onload = null;
    };
  }, [src, detections, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full rounded-lg overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-auto rounded-lg"
      />
    </div>
  );
}