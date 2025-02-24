import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Detection } from "@/lib/types";

interface DetectionDisplayProps {
  imageUrl?: string;
  videoUrl?: string;
  detectionResults?: {
    has_detections: boolean;
    detections: Detection[];
  };
  type?: 'image' | 'video';
}

export function DetectionDisplay({ imageUrl, videoUrl, detectionResults, type = 'image' }: DetectionDisplayProps) {
  const mediaUrl = type === 'image' ? imageUrl : videoUrl;
  
  if (!mediaUrl) return null;

  // Group detections by label and count occurrences (only for image mode)
  const labelCounts = type === 'image' && detectionResults?.detections 
    ? detectionResults.detections.reduce((acc, det) => {
        acc[det.label] = (acc[det.label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Image/Video result */}
      <Card>
        <CardContent className="p-4">
          {type === 'image' ? (
            <img src={mediaUrl} alt="Annotated traffic sign detection" className="w-full rounded-lg" />
          ) : (
            <video src={mediaUrl} controls className="w-full rounded-lg" />
          )}
        </CardContent>
      </Card>

      {/* Detection results - Enhanced display for image mode */}
      {type === 'image' && detectionResults?.has_detections && detectionResults.detections.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">Detected Traffic Signs</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(labelCounts).map(([label, count]) => (
                <Badge 
                  key={label} 
                  variant="secondary"
                  className="text-sm py-1.5 px-3"
                >
                  {label} {count > 1 && `(${count})`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video mode detections */}
      {type === 'video' && detectionResults?.has_detections && detectionResults.detections.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">Detected Signs</h3>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {detectionResults.detections.map((detection, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary">{detection.label}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Confidence: {(detection.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}