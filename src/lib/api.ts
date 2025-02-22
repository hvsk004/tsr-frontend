// src/lib/api.ts
import { config } from './config';
import { WebSocketMessage } from './types';

interface PredictOptions {
  mode?: 'gtsdb' | 'gtsrb' | 'both';
  confidenceThreshold?: number;
  debug?: boolean;
}

export interface PredictResponse {
  blob: Blob;
  type: 'image' | 'video';
  url: string;
}

// Function to upload media (image or video)
export async function uploadMedia(file: File, options: PredictOptions = {}): Promise<PredictResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', options.mode || 'both');
  formData.append('conf_threshold', (options.confidenceThreshold || 0.6).toString());
  formData.append('debug', (options.debug || false).toString());

  console.log('Uploading file:', file.name);

  const response = await fetch(`${config.apiUrl}/predict`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload media: ${errorText}`);
  }

  // Get response headers
  const contentType = response.headers.get('content-type');
  const disposition = response.headers.get('content-disposition');
  const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch ? filenameMatch[1] : '';

  // Get response data as ArrayBuffer to properly handle binary data
  const arrayBuffer = await response.arrayBuffer();
  const isVideo = filename.toLowerCase().endsWith('.mp4') || contentType?.includes('video');

  // Create blob with proper MIME type and encoding
  const blob = new Blob([arrayBuffer], { 
    type: isVideo ? 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"' : 'image/jpeg' 
  });

  // Create URL for the blob
  const url = URL.createObjectURL(blob);

  console.log('Created media URL:', {
    type: isVideo ? 'video' : 'image',
    blobSize: blob.size,
    url,
    mimeType: blob.type,
    filename,
    contentType
  });

  return { 
    blob, 
    type: isVideo ? 'video' : 'image', 
    url 
  };
}

// Function to handle WebSocket connection for live webcam predictions
export function createWebSocketConnection(
  onMessage: (data: WebSocketMessage) => void,
  onError: (error: Event) => void,
  onOpen?: () => void,
  onClose?: () => void
): WebSocket {
  const wsUrl = `${config.websocketUrl}/ws/predict`;
  console.log('Creating WebSocket connection:', {
    configUrl: config.websocketUrl,
    fullUrl: wsUrl,
    envVar: import.meta.env.VITE_WS_URL
  });
  
  const ws = new WebSocket(wsUrl);
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    console.log('WebSocket connection opened');
    if (onOpen) onOpen();
  };

  ws.onmessage = (event) => {
    try {
      console.log('WebSocket message received:', {
        type: typeof event.data,
        size: typeof event.data === 'string' ? event.data.length : 'N/A',
        timestamp: new Date().toISOString()
      });

      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          console.log('Parsed WebSocket data:', data);
          
          // First send frame data
          if (data.image) {
            onMessage({
              type: 'frame',
              data: data.image,
              hasDetections: data.hasDetections
            });
          }

          // Then handle detections if they exist
          if (Array.isArray(data.detections)) {
            onMessage({
              type: 'detection',
              data: data.detections
            });
          } else if (data.hasDetections === false) {
            // If explicitly marked as no detections, send empty array
            onMessage({
              type: 'detection',
              data: []
            });
          }

          // Handle errors
          if (data.error) {
            onMessage({
              type: 'error',
              data: data.error
            });
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          onError(new Event('parse_error'));
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      onError(new Event('message_error'));
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    onError(error);
  };

  ws.onclose = (event) => {
    console.log('WebSocket connection closed:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
    if (onClose) onClose();
  };

  return ws;
}