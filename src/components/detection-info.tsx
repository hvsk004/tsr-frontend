import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface DetectionInfoProps {
  signNames: string[];
  hasDetections: boolean;
}

export function DetectionInfo({ signNames, hasDetections }: DetectionInfoProps) {
  if (!hasDetections || signNames.length === 0) {
    return (
      <Card className="w-full bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle>Detected Signs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No traffic signs detected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>
          Detected Signs
          <Badge variant="secondary" className="ml-2">
            {signNames.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[100px] w-full rounded-md">
          <div className="flex flex-wrap gap-2 p-1">
            {signNames.map((sign, index) => (
              <Badge 
                key={`${sign}-${index}`}
                variant="default"
                className="text-sm py-1 px-3"
              >
                {sign}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}