import { useEffect, useRef, useState } from 'react';
import { DetectionResult } from '@/lib/types';

interface DetectionDisplayProps {
  src: string;
  detections: DetectionResult[];
  type: 'image' | 'video';
}

export function DetectionDisplay({ src, detections, type }: DetectionDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    console.log('DetectionDisplay mounted:', {
      type,
      src,
      hasDetections: detections?.length > 0
    });

    // For videos, log when the source changes
    if (type === 'video' && videoRef.current) {
      console.log('Setting video source:', src);
      videoRef.current.src = src;
    }

    return () => {
      if (type === 'video' && videoRef.current) {
        videoRef.current.src = '';
      }
    };
  }, [src, type]);

  // Handle video loading events
  const handleVideoLoad = () => {
    console.log('Video loaded successfully');
    setVideoError(null);
  };

  // Video error handler
  const handleVideoError = (error: any) => {
    const videoElement = videoRef.current;
    setVideoError(error?.message || 'Video playback error');
    console.error('Video playback error:', {
      error,
      videoElement: {
        readyState: videoElement?.readyState,
        networkState: videoElement?.networkState,
        error: videoElement?.error,
        src: videoElement?.src
      }
    });
  };

  if (type === 'video') {
    return (
      <div ref={containerRef} className="relative w-full rounded-lg overflow-hidden bg-black">
        {videoError && (
          <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-sm">
            {videoError}
          </div>
        )}
        <video
          ref={videoRef}
          key={src} // Force remount when src changes
          src={src}
          className="w-full h-auto rounded-lg"
          controls
          preload="auto"
          playsInline
          crossOrigin="anonymous"
          style={{ display: videoError ? 'none' : 'block' }}
          onError={handleVideoError}
          onLoadedData={handleVideoLoad}
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {videoError && (
          <div className="w-full h-[300px] bg-gray-800 flex items-center justify-center text-white">
            Failed to load video: {videoError}
          </div>
        )}
      </div>
    );
  }

  useEffect(() => {
    if (type === 'video') {
      return; // Skip canvas handling for videos
    }

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
  }, [src, detections, dimensions, type]);

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