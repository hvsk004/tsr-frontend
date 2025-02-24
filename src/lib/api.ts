// src/lib/api.ts
import { config } from './config';
import { WebSocketMessage, Detection } from './types';

interface PredictOptions {
  mode?: 'gtsdb' | 'gtsrb' | 'both';
  confidenceThreshold?: number;
  debug?: boolean;
}

export interface PredictResponse {
  blob: Blob;
  type: 'image' | 'video';
  url: string;
  detectionResults?: {
    has_detections: boolean;
    detections: Detection[];
  };
}

// Function to upload media (image or video)
export async function uploadMedia(file: File, options: PredictOptions = {}): Promise<PredictResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', options.mode || 'both');
  formData.append('conf_threshold', (options.confidenceThreshold || 0.6).toString());
  formData.append('debug', (options.debug || false).toString());

  console.log('[Debug] Uploading file:', {
    name: file.name,
    type: file.type,
    size: file.size,
    mode: options.mode,
    confidenceThreshold: options.confidenceThreshold,
    debug: options.debug
  });

  const response = await fetch(`${config.apiUrl}/predict`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload media: ${errorText}`);
  }

  // Log all response headers for debugging
  const headers = Object.fromEntries([...response.headers.entries()]);
  console.log('[Debug] Full response details:', {
    status: response.status,
    statusText: response.statusText,
    headers,
    url: response.url
  });

  // Get response headers
  const contentType = response.headers.get('content-type');
  const disposition = response.headers.get('content-disposition');
  const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch?.[1] || '';
  const isVideo = (filename && filename.toLowerCase().endsWith('.mp4')) || contentType?.includes('video');

  // Get binary data
  const buffer = await response.arrayBuffer();
  
  // Create the appropriate blob type
  const blob = isVideo 
    ? new Blob([buffer], { type: 'video/mp4' })
    : new Blob([buffer], { type: contentType || 'image/jpeg' });

  if (isVideo) {
    console.log('[Debug] Created video blob:', {
      size: blob.size,
      type: blob.type,
      contentType,
      filename
    });
  }

  const objectUrl = URL.createObjectURL(blob);
  
  // Get detection results from header for image mode only
  let detectionResults: PredictResponse['detectionResults'] | undefined;
  if (!isVideo) {
    // Try both cases since headers should be case-insensitive
    const detectionHeader = 
      response.headers.get('x-detection-results') || 
      response.headers.get('X-Detection-Results');
    
    console.log('[Debug] Detection header details:', {
      headerValue: detectionHeader,
      allHeaders: headers,
      headerKeys: [...response.headers.keys()],
      hasHeader: response.headers.has('x-detection-results'),
      hasUpperHeader: response.headers.has('X-Detection-Results')
    });
    
    if (detectionHeader) {
      try {
        detectionResults = JSON.parse(detectionHeader);
        console.log('[Debug] Successfully parsed detection results:', {
          hasDetections: detectionResults?.has_detections,
          detectionsCount: detectionResults?.detections?.length,
          fullResults: detectionResults
        });
      } catch (error) {
        console.error('[Debug] Failed to parse detection results:', {
          error,
          headerValue: detectionHeader,
          responseStatus: response.status,
          responseStatusText: response.statusText
        });
      }
    } else {
      console.warn('[Debug] No detection header found. Headers available:', 
        [...response.headers.keys()].join(', ')
      );
    }
  }

  const result: PredictResponse = { 
    blob, 
    type: isVideo ? 'video' : 'image',
    url: objectUrl,
    detectionResults
  };

  console.log('[Debug] Returning upload result:', result);

  return result;
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