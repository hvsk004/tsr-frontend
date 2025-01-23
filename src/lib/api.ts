// src/lib/api.ts
import { config } from './config';

// Function to upload media (image or video)
export async function uploadMedia(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${config.apiUrl}/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload media');
  }

  const blob = await response.blob();
  return blob;
}

// Function to handle WebSocket connection for live webcam predictions
export function createWebSocketConnection(
  onMessage: (data: Blob) => void,
  onError: (error: Event) => void,
  onOpen?: () => void,
  onClose?: () => void
): WebSocket {
  const ws = new WebSocket(`${config.websocketUrl}/ws/predict`);

  ws.binaryType = 'arraybuffer'; // Ensure binary data is handled correctly

  ws.onopen = () => {
    console.log('WebSocket connection opened');
    if (onOpen) onOpen();
  };

  ws.onmessage = (event) => {
    if (typeof event.data === 'string') {
      console.log('WebSocket message:', event.data);
    } else {
      const blob = new Blob([event.data], { type: 'image/jpeg' });
      onMessage(blob);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
    if (onClose) onClose();
  };

  return ws;
}