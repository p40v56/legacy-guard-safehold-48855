import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-card border-border backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-foreground text-xl">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Please try again or return to the homepage.
            </p>
          </div>
          
          <p className="text-muted-foreground text-sm text-center">
            We apologize for the inconvenience. Please try refreshing the page or return to the homepage.
          </p>
          
          <div className="flex gap-3 pt-2">
            <Button
              onClick={resetErrorBoundary}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorFallback;