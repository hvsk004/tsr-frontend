export interface DetectionResult {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  class: string;
  confidence: number;
}

export interface WebSocketMessage {
  type: 'detection' | 'error' | 'frame';
  data: DetectionResult[] | string;
  hasDetections?: boolean;
}

export type UploadMode = 'image' | 'video' | 'webcam';