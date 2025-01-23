// src/pages/dashboard.tsx
import { useState, useEffect, useRef } from 'react';
import { UploadCard } from '@/components/upload-card';
import { UploadMode } from '@/lib/types';  // 'image' | 'video' | 'webcam'
import { uploadMedia, createWebSocketConnection } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PageContainer } from '@/components/layout/page-container';

export function Dashboard() {
  // Track the selected upload mode ('image' | 'video' | 'webcam')
  const [selectedMode, setSelectedMode] = useState<UploadMode>('image');
  // Store the source URL of the processed media (Blob URL)
  const [mediaSource, setMediaSource] = useState<string>('');
  // Track if the webcam is active
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  // Refs for hidden video and canvas elements
  const webcamRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Toast hook for notifications
  const { toast } = useToast();
  // Ref to store the WebSocket instance
  const wsRef = useRef<WebSocket | null>(null);

  // Cleanup on component unmount or when mediaSource changes
  useEffect(() => {
    return () => {
      // Revoke the media URL to free memory
      if (mediaSource) {
        URL.revokeObjectURL(mediaSource);
      }
      // Close the WebSocket connection if it exists
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [mediaSource]);

  // Handle file uploads (image or video)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Upload the media file to the backend
      const responseBlob = await uploadMedia(file);

      // Log Blob details for debugging
      console.log("Received Blob:", responseBlob);
      console.log("Blob Size:", responseBlob.size, "bytes");
      console.log("Blob Type:", responseBlob.type);

      // Create a local URL for the processed media
      const mediaUrl = URL.createObjectURL(responseBlob);

      // Update the media source to display the processed media
      setMediaSource(mediaUrl);
    } catch (error) {
      // Show error toast if upload fails
      toast({
        title: 'Upload Error',
        description: 'Failed to process the file. Please try again.',
        variant: 'destructive',
      });
      console.error('Upload error:', error);
    }
  };

  // Start the webcam and establish WebSocket connection
  const startWebcam = async () => {
    setIsWebcamActive(true);

    // Access the user's webcam
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        webcamRef.current.play();
      }
    } catch (error) {
      // Show error toast if webcam access fails
      toast({
        title: 'Webcam Error',
        description: 'Unable to access the webcam. Please check your permissions.',
        variant: 'destructive',
      });
      console.error('Webcam access error:', error);
      setIsWebcamActive(false);
      return;
    }

    // Establish a WebSocket connection to the backend
    wsRef.current = createWebSocketConnection(
      handleWebSocketMessage,
      handleWebSocketError,
      () => {
        console.log('WebSocket connection established.');
      },
      () => {
        console.log('WebSocket connection closed.');
        setIsWebcamActive(false);
      }
    );

    // Start capturing and sending frames at intervals (e.g., every 500ms)
    const captureInterval = setInterval(() => {
      captureAndSendFrame();
    }, 500); // Adjust the interval as needed

    // Clear the interval when the WebSocket closes
    wsRef.current.onclose = () => {
      clearInterval(captureInterval);
    };
  };

  // Capture a frame from the webcam and send it via WebSocket
  const captureAndSendFrame = () => {
    const video = webcamRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const context = canvas.getContext('2d');
      if (!context) return;

      // Set canvas dimensions to match the video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current frame from the video onto the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert the canvas content to a Blob (JPEG format)
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result && reader.result instanceof ArrayBuffer) {
              try {
                // Send the ArrayBuffer over WebSocket
                wsRef.current?.send(reader.result);
              } catch (sendError) {
                console.error('Error sending frame over WebSocket:', sendError);
                // Optionally, handle the error or close the WebSocket
              }
            }
          };
          reader.readAsArrayBuffer(blob);
        }
      }, 'image/jpeg', 0.5); // Adjust image quality as needed
    }
  };

  // Handle incoming WebSocket messages (annotated frames)
  const handleWebSocketMessage = (data: Blob) => {
    // Create a URL for the annotated image blob
    const annotatedUrl = URL.createObjectURL(data);

    // Update the media source to display the annotated frame
    setMediaSource(annotatedUrl);
  };

  // Handle WebSocket errors
  const handleWebSocketError = (error: Event) => {
    // Show error toast if WebSocket encounters an error
    toast({
      title: 'WebSocket Error',
      description: 'An error occurred with the webcam connection.',
      variant: 'destructive',
    });
    console.error('WebSocket error:', error);
    setIsWebcamActive(false);
  };

  // Stop the webcam and close WebSocket connection
  const stopWebcam = () => {
    setIsWebcamActive(false);

    // Close the WebSocket connection if it exists
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop the webcam stream
    if (webcamRef.current && webcamRef.current.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      webcamRef.current.srcObject = null;
    }

    // Revoke the media URL to free memory
    if (mediaSource) {
      URL.revokeObjectURL(mediaSource);
      setMediaSource('');
    }
  };

  return (
    <PageContainer>
      <div className="w-full flex flex-col items-center space-y-8">
        {/* Dashboard Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center">
          Detection Dashboard
        </h1>

        {/* Upload Mode Selection */}
        <div className="w-[95%] max-w-[1800px] grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* UploadCard for Image */}
          <UploadCard
            mode="image"
            onSelect={() => setSelectedMode('image')}
            isActive={selectedMode === 'image'}
          />
          {/* UploadCard for Video */}
          <UploadCard
            mode="video"
            onSelect={() => setSelectedMode('video')}
            isActive={selectedMode === 'video'}
          />
          {/* UploadCard for Webcam */}
          <UploadCard
            mode="webcam"
            onSelect={() => setSelectedMode('webcam')}
            isActive={selectedMode === 'webcam'}
          />
        </div>

        {/* Media Upload or Webcam Stream */}
        <div className="w-[95%] max-w-[1800px] mx-auto space-y-8">
          {selectedMode === 'webcam' ? (
            <div className="flex flex-col items-center space-y-4">
              {/* Hidden Webcam Video Element */}
              <video ref={webcamRef} className="hidden" />

              {/* Hidden Canvas Element */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Display Annotated Video */}
              {mediaSource && (
                <video
                  src={mediaSource}
                  className="max-w-full h-auto border-2 border-primary rounded"
                  autoPlay
                  loop
                  muted
                >
                  Your browser does not support the video tag.
                </video>
              )}

              {/* Control Buttons to Start/Stop Webcam */}
              {!isWebcamActive ? (
                <button
                  onClick={startWebcam}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Start Webcam
                </button>
              ) : (
                <button
                  onClick={stopWebcam}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Stop Webcam
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Input for Image or Video */}
              <input
                type="file"
                accept={selectedMode === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              {/* Label for File Upload */}
              <label
                htmlFor="file-upload"
                className="block w-full p-[5%] border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-primary transition-colors"
              >
                <div className="space-y-2">
                  <p className="text-lg md:text-xl lg:text-2xl font-medium">
                    Drop your {selectedMode} here or click to upload
                  </p>
                  <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
                    Supported formats: {selectedMode === 'image' ? 'PNG, JPG, JPEG' : 'MP4, WebM'}
                  </p>
                </div>
              </label>

              {/* Display Processed Media */}
              {mediaSource && (
                selectedMode === 'image' ? (
                  <img
                    src={mediaSource}
                    alt="Processed Image"
                    className="max-w-full h-auto border-2 border-primary rounded"
                  />
                ) : (
                  <video
                    controls
                    src={mediaSource} // Directly assign the Blob URL
                    className="max-w-full h-auto border-2 border-primary rounded"
                  >
                    Your browser does not support the video tag.
                  </video>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}