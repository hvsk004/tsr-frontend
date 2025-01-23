import { config } from './config';
import { WebSocketMessage } from './types';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private onMessageCallback: ((data: WebSocketMessage) => void) | null = null;

  connect(onMessage: (data: WebSocketMessage) => void) {
    this.onMessageCallback = onMessage;
    this.ws = new WebSocket(`${config.websocketUrl}/predict/webcam`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          console.error('WebSocket error:', data.error);
          return;
        }
        
        if (this.onMessageCallback && data.detections) {
          // Transform the detections to match our frontend format
          const transformedDetections = data.detections.map((det: any) => ({
            boundingBox: {
              x: det.bbox[0],
              y: det.bbox[1],
              width: det.bbox[2] - det.bbox[0],
              height: det.bbox[3] - det.bbox[1],
            },
            class: det.class.toString(),
            confidence: det.confidence,
          }));
          
          this.onMessageCallback({
            type: 'detection',
            data: transformedDetections,
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return this.ws;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.onMessageCallback = null;
    }
  }

  sendFrame(frame: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(frame);
    }
  }
}

export const wsClient = new WebSocketClient();