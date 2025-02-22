import { config } from './config';
import { WebSocketMessage } from './types';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private onMessageCallback: ((data: WebSocketMessage) => void) | null = null;
  private frameInterval: number = 1000 / 20; // Match backend's 20 FPS
  private lastFrameTime: number = 0;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private connectionTimeout: number = 5000;

  connect(onMessage: (data: WebSocketMessage) => void) {
    this.onMessageCallback = onMessage;
    this.ws = new WebSocket(`${config.websocketUrl}/ws/predict`);
    this.ws.binaryType = 'arraybuffer';
    
    const timeoutId = setTimeout(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        console.error('WebSocket connection timed out');
        this.handleError('Connection timed out');
      }
    }, this.connectionTimeout);

    this.ws.onopen = () => {
      console.log('WebSocket connected successfully');
      clearTimeout(timeoutId);
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      clearTimeout(timeoutId);
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => this.connect(onMessage), 1000 * this.reconnectAttempts);
      } else {
        this.handleError('Connection closed after max reconnection attempts');
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleError('Connection error');
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };

    return this.ws;
  }

  private handleMessage(event: MessageEvent) {
    try {
      if (typeof event.data === 'string') {
        const data = JSON.parse(event.data);
        console.log('Received message:', {
          hasError: !!data.error,
          hasImage: !!data.image,
          hasDetections: data.hasDetections,
          detections: data.detections
        });
        
        if (data.error) {
          this.handleError(data.error);
        } else if (data.image) {
          // Send both frame and detections in one message if available
          this.onMessageCallback?.({
            type: 'frame',
            data: data.image,
            hasDetections: data.hasDetections
          });

          // Send detections if they exist
          if (data.detections) {
            this.onMessageCallback?.({
              type: 'detection',
              data: data.detections
            });
          } else if (data.hasDetections === false) {
            // If explicitly marked as no detections, send empty array
            this.onMessageCallback?.({
              type: 'detection',
              data: []
            });
          }
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      this.handleError('Failed to process server message');
    }
  }

  private handleError(message: string) {
    console.error('WebSocket error:', message);
    this.onMessageCallback?.({
      type: 'error',
      data: message
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.onMessageCallback = null;
      this.reconnectAttempts = 0;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async sendFrame(frame: string) {
    if (!this.isConnected()) return;

    const currentTime = Date.now();
    if (currentTime - this.lastFrameTime < this.frameInterval) return;

    try {
      const binaryString = atob(frame.split(',')[1]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      this.ws!.send(bytes.buffer);
      this.lastFrameTime = currentTime;
    } catch (error) {
      console.error('Error sending frame:', error);
      this.handleError('Failed to send frame');
    }
  }
}

export const wsClient = new WebSocketClient();