export interface Detection {
  box: [number, number, number, number]; // [x1, y1, x2, y2]
  label: string;                         // Traffic sign class name
  confidence: number;                    // Confidence score (0-1)
}

export interface DetectionResults {
  has_detections: boolean;
  detections: Detection[];
}

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