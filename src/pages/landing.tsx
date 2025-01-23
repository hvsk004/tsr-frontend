import { ArrowRight, Shield, Zap, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/page-container';
import { Section } from '@/components/layout/section';

export function Landing() {
  return (
    <PageContainer>
      <Section>
        <div className="flex flex-col items-center text-center w-full">
          <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:text-7xl xl:text-8xl lg:leading-[1.1] bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent w-[90%] max-w-[1400px]">
            Traffic Sign Detection
          </h1>
          <p className="mt-4 w-[85%] max-w-[900px] text-lg text-muted-foreground sm:text-xl lg:text-2xl">
            Advanced AI-powered traffic sign detection system for enhanced road safety and autonomous driving
          </p>
          <Button size="lg" className="mt-8" asChild>
            <a href="/dashboard" className="flex items-center">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>

        <div className="w-[95%] max-w-[1800px] grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Enhanced Safety</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Real-time detection and alerts for improved road safety and accident prevention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span>Real-time Processing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Instant traffic sign detection through advanced AI algorithms
              </p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                <span>Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Comprehensive analytics and reporting for traffic sign detection data
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="w-[95%] max-w-[1800px] relative overflow-hidden rounded-lg">
          <img
            src="https://images.unsplash.com/photo-1617471346061-5d329ab9c574?auto=format&fit=crop&q=80&w=2000"
            alt="Traffic Detection"
            className="w-full h-auto aspect-[21/9] object-cover"
          />
          <div className="absolute inset-0 flex items-center bg-gradient-to-r from-background/90 to-background/20">
            <div className="p-[5%]">
              <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl xl:text-5xl">
                State-of-the-art Detection
              </h2>
              <p className="mt-4 max-w-[80%] text-lg lg:text-xl">
                Our system uses advanced computer vision and machine learning to provide accurate and reliable traffic sign detection.
              </p>
              <Button variant="secondary" size="lg" className="mt-6" asChild>
                <a href="/dashboard">Try Demo</a>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </PageContainer>
  );
}