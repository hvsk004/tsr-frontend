// src/pages/dashboard.tsx
import { useState, useEffect, useRef } from 'react';
import { UploadCard } from '@/components/upload-card';
import { DetectionDisplay } from '@/components/detection-display';
import { UploadMode, DetectionResult, WebSocketMessage } from '@/lib/types';
import { uploadMedia, createWebSocketConnection } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PageContainer } from '@/components/layout/page-container';
import { config } from '@/lib/config';

export function Dashboard() {
  const [selectedMode, setSelectedMode] = useState<UploadMode>('image');
  const [mediaSource, setMediaSource] = useState<string>('');
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (isWebcamActive && wsRef.current?.readyState === WebSocket.OPEN) {
      setWsConnected(true);
      cleanup = startSendingFrames();
    } else {
      setWsConnected(false);
    }

    const wsCheckInterval = setInterval(() => {
      const isConnected = wsRef.current?.readyState === WebSocket.OPEN;
      setWsConnected(isConnected);
      
      if (!isConnected && isWebcamActive) {
        console.log('WebSocket disconnected, attempting to reconnect...');
        try {
          wsRef.current = createWebSocketConnection(
            handleWebSocketMessage,
            handleWebSocketError,
            () => {
              console.log('WebSocket reconnected');
              setWsConnected(true);
            },
            () => {
              console.log('WebSocket connection closed');
              setWsConnected(false);
            }
          );
        } catch (error) {
          console.error('WebSocket reconnection failed:', error);
        }
      }
    }, 1000);

    return () => {
      if (cleanup) {
        cleanup();
      }
      clearInterval(wsCheckInterval);
    };
  }, [isWebcamActive]);

  const cleanupMedia = () => {
    if (mediaSource) {
      URL.revokeObjectURL(mediaSource);
      setMediaSource('');
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setDetections([]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      cleanupMedia(); // Cleanup previous media

      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });

      const response = await uploadMedia(file, {
        mode: 'both',
        confidenceThreshold: 0.6,
        debug: false
      });

      // For video files, create a new blob with explicit MIME type
      if (response.type === 'video') {
        const videoBlob = new Blob([response.blob], {
          type: 'video/mp4'
        });
        
        // Revoke old URL if it exists
        if (mediaSource) {
          URL.revokeObjectURL(mediaSource);
        }
        
        const newUrl = URL.createObjectURL(videoBlob);
        console.log('Created video URL:', {
          originalType: response.blob.type,
          newType: videoBlob.type,
          size: videoBlob.size,
          url: newUrl
        });
        
        setMediaSource(newUrl);
      } else {
        setMediaSource(response.url);
      }

      // Update selected mode
      setSelectedMode(response.type);

      toast({
        title: 'Success',
        description: 'File processed successfully!',
        variant: 'default',
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Error',
        description: error instanceof Error ? error.message : 'Failed to process the file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = ''; // Reset file input
      }
    }
  };

  const startWebcam = async () => {
    try {
      console.log('Starting webcam with WebSocket URL:', config.websocketUrl);
      setIsConnecting(true);
      setWebcamError(null);
      
      // First establish WebSocket connection
      try {
        console.log('Establishing WebSocket connection...');
        wsRef.current = createWebSocketConnection(
          (data) => {
            console.log('WebSocket message received:', data);
            handleWebSocketMessage(data);
          },
          handleWebSocketError,
          () => {
            console.log('WebSocket connection established');
            setWsConnected(true);
            setIsConnecting(false);
          },
          () => {
            console.log('WebSocket connection closed');
            setWsConnected(false);
            handleWebSocketError(new Event('close'));
          }
        );
      } catch (wsError) {
        console.error('WebSocket connection failed:', wsError);
        handleWebSocketError(new Event('error'));
        setIsConnecting(false);
        throw new Error('Failed to establish WebSocket connection');
      }

      // Then start the webcam once WebSocket is connected
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        await webcamRef.current.play();
        console.log('Webcam stream started');
        setIsWebcamActive(true);
      }

    } catch (error) {
      setWebcamError(error instanceof Error ? error.message : 'Failed to start webcam');
      toast({
        title: 'Webcam Error',
        description: 'Unable to access the webcam. Please check your permissions.',
        variant: 'destructive',
      });
      console.error('Webcam access error:', error);
      setIsWebcamActive(false);
      setIsConnecting(false);
      setWsConnected(false);
    }
  };

  const startSendingFrames = () => {
    console.log('Starting frame sending with 20fps interval');
    let frameCount = 0;
    let lastLogTime = Date.now();
    let intervalId: ReturnType<typeof setInterval>;

    const sendFrame = async () => {
      if (!isWebcamActive || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.log('Frame sending stopped - conditions not met');
        if (intervalId) clearInterval(intervalId);
        return;
      }

      await captureAndSendFrame();
      frameCount++;

      // Log frame rate every second
      const now = Date.now();
      if (now - lastLogTime >= 1000) {
        console.log(`Frames sent in last second: ${frameCount}`);
        frameCount = 0;
        lastLogTime = now;
      }
    };

    // Send frames at 20fps (50ms interval)
    intervalId = setInterval(sendFrame, 50);
    
    // Return cleanup function
    return () => {
      console.log('Cleaning up frame sending interval');
      if (intervalId) clearInterval(intervalId);
    };
  };

  const captureAndSendFrame = async () => {
    const video = webcamRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    try {
      // Set fixed dimensions to match backend expectations
      canvas.width = 640;
      canvas.height = 480;
      
      // Draw video frame to canvas, maintaining aspect ratio
      const scale = Math.min(640 / video.videoWidth, 480 / video.videoHeight);
      const x = (640 - video.videoWidth * scale) / 2;
      const y = (480 - video.videoHeight * scale) / 2;
      
      context.fillStyle = '#000';
      context.fillRect(0, 0, 640, 480);
      context.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);

      return new Promise<void>((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
            try {
              // Send the blob directly as bytes
              const buffer = await blob.arrayBuffer();
              wsRef.current.send(buffer);
              resolve();
            } catch (error) {
              console.error('Error sending frame:', error);
              reject(error);
            }
          } else {
            resolve(); // Resolve without sending if conditions aren't met
          }
        }, 'image/jpeg', 0.8);
      });
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
  };

  const handleWebSocketMessage = (data: WebSocketMessage) => {
    console.log('Received WebSocket message:', data.type, data);
    if (data.type === 'frame') {
      if (mediaSource) {
        URL.revokeObjectURL(mediaSource);
      }
      setMediaSource(data.data as string);
      
      // If no detections were found, clear the detections array
      if (data.hasDetections === false) {
        setDetections([]);
      }
    } else if (data.type === 'detection') {
      setDetections(data.data as DetectionResult[]);
    } else if (data.type === 'error') {
      toast({
        title: 'Detection Error',
        description: data.data as string,
        variant: 'destructive',
      });
    }
  };

  const handleWebSocketError = (error: Event) => {
    setIsConnecting(false);
    setWsConnected(false);
    toast({
      title: 'WebSocket Error',
      description: 'Connection error. The live detection feed will not be available.',
      variant: 'destructive',
    });
    console.error('WebSocket error:', error);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    // Don't stop the webcam here, just clear the processed feed
    if (mediaSource) {
      URL.revokeObjectURL(mediaSource);
      setMediaSource('');
    }
    setDetections([]);
  };

  const stopWebcam = () => {
    console.log('Stopping webcam and frame sending');
    setIsWebcamActive(false);
    setIsConnecting(false);
    setWsConnected(false);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (webcamRef.current?.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      webcamRef.current.srcObject = null;
    }
    if (mediaSource) {
      URL.revokeObjectURL(mediaSource);
      setMediaSource('');
    }
    setDetections([]);
    setWebcamError(null);
  };

  return (
    <PageContainer>
      <div className="w-full flex flex-col items-center space-y-8">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center">
          Traffic Sign Detection
        </h1>

        <div className="w-[95%] max-w-[1800px] grid grid-cols-1 md:grid-cols-3 gap-6">
          <UploadCard
            mode="image"
            onSelect={() => {
              cleanupMedia();
              setSelectedMode('image');
            }}
            isActive={selectedMode === 'image'}
          />
          <UploadCard
            mode="video"
            onSelect={() => {
              cleanupMedia();
              setSelectedMode('video');
            }}
            isActive={selectedMode === 'video'}
          />
          <UploadCard
            mode="webcam"
            onSelect={() => {
              cleanupMedia();
              setSelectedMode('webcam');
            }}
            isActive={selectedMode === 'webcam'}
          />
        </div>

        <div className="w-[95%] max-w-[1800px] mx-auto space-y-8">
          {selectedMode === 'webcam' ? (
            <div className="flex flex-col items-center space-y-4">
              {webcamError && (
                <div className="w-full p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {webcamError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="relative">
                  <h3 className="text-lg font-semibold mb-2">Live Feed</h3>
                  {isConnecting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                      <div className="text-white">Connecting to server...</div>
                    </div>
                  )}
                  <video 
                    ref={webcamRef}
                    autoPlay 
                    playsInline
                    muted
                    className="w-full h-auto rounded-lg"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                
                <div className="relative">
                  <h3 className="text-lg font-semibold mb-2">
                    Processed Feed 
                    {isWebcamActive && !wsRef.current && (
                      <span className="text-sm text-red-500 ml-2">
                        (Connection Failed)
                      </span>
                    )}
                  </h3>
                  {mediaSource ? (
                    <DetectionDisplay
                      src={mediaSource}
                      detections={detections}
                      type="image"  // Change this to "image" since we're receiving individual frames
                    />
                  ) : (
                    <div className="w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">
                        {isWebcamActive && !wsRef.current 
                          ? 'Server connection failed. Try stopping and starting the webcam.'
                          : 'Waiting for processed feed...'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={isWebcamActive ? stopWebcam : startWebcam}
                disabled={isUploading || isConnecting}
                className={`px-4 py-2 text-white rounded transition ${
                  isWebcamActive 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } ${(isUploading || isConnecting) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isConnecting 
                  ? 'Connecting...' 
                  : isWebcamActive 
                    ? `Stop Webcam${!wsConnected ? ' (Reconnecting...)' : ''}`
                    : 'Start Webcam'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="file"
                accept={selectedMode === 'image' 
                  ? 'image/jpeg,image/png,image/jpg' 
                  : 'video/mp4,video/quicktime,video/x-msvideo'}
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`block w-full p-[5%] border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                  isUploading 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:border-primary'
                }`}
              >
                <div className="space-y-2">
                  <p className="text-lg md:text-xl lg:text-2xl font-medium">
                    {isUploading 
                      ? 'Processing...' 
                      : `Drop your ${selectedMode} here or click to upload`}
                  </p>
                  <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
                    {selectedMode === 'image' 
                      ? 'Supported formats: PNG, JPG, JPEG' 
                      : 'Supported formats: MP4 (recommended), MOV, AVI'}
                  </p>
                </div>
              </label>

              {mediaSource && (
                <div className="relative">
                  <DetectionDisplay
                    src={mediaSource}
                    detections={detections}
                    type={selectedMode === 'image' ? 'image' : 'video'}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}