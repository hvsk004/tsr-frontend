import { Book, Shield, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/page-container';

export function About() {
  return (
    <PageContainer>
      <div className="w-full flex flex-col items-center space-y-8 max-w-[1800px] mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center">About Traffic Sign Detection</h1>
        
        <div className="prose prose-neutral dark:prose-invert text-center w-[90%] max-w-[1200px]">
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground">
            Our traffic sign detection system combines cutting-edge computer vision with
            deep learning to provide accurate, real-time identification of traffic signs.
            This technology is essential for advancing road safety and autonomous driving capabilities.
          </p>
        </div>

        <div className="w-[95%] grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Mission</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To enhance road safety through innovative AI-powered traffic sign detection technology.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span>Technology</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced AI algorithms and real-time processing for accurate sign detection.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-primary" />
                <span>Research</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Continuous research and development to improve detection accuracy and speed.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="w-[95%] rounded-lg overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1589648751789-c8949118c327?auto=format&fit=crop&q=80&w=2000"
            alt="Traffic Technology"
            className="w-full aspect-[21/9] object-cover rounded-lg"
          />
        </div>
      </div>
    </PageContainer>
  );
}