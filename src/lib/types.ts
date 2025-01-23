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
  type: 'detection' | 'error';
  data: DetectionResult[] | string;
}

export type UploadMode = 'image' | 'video' | 'webcam';