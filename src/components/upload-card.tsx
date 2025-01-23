import { UploadCloud, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadMode } from '@/lib/types';

interface UploadCardProps {
  mode: UploadMode;
  onSelect: () => void;
  isActive: boolean;
}

export function UploadCard({ mode, onSelect, isActive }: UploadCardProps) {
  const getIcon = () => {
    if (mode === 'webcam') return Camera;
    return UploadCloud;
  };

  const getTitle = () => {
    switch (mode) {
      case 'image':
        return 'Upload Image';
      case 'video':
        return 'Upload Video';
      case 'webcam':
        return 'Live Detection';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'image':
        return 'Upload an image to detect traffic signs';
      case 'video':
        return 'Upload a video to detect traffic signs';
      case 'webcam':
        return 'Use your webcam for real-time detection';
    }
  };

  const Icon = getIcon();

  return (
    <Card
      className={`cursor-pointer transition-all hover:border-primary ${
        isActive ? 'border-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Icon className="h-5 w-5" />
          <span>{getTitle()}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{getDescription()}</p>
        <Button className="w-full" variant={isActive ? 'default' : 'outline'}>
          {isActive ? 'Selected' : 'Select'}
        </Button>
      </CardContent>
    </Card>
  );
}