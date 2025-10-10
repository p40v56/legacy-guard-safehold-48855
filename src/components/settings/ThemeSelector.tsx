import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const themes = [
  {
    id: 'fresh-clean',
    name: 'Fresh & Clean',
    description: 'Light and airy with soft blues and whites',
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
      background: '#FFFFFF',
      card: '#F8FAFC'
    }
  },
  {
    id: 'warm-welcoming',
    name: 'Warm & Welcoming',
    description: 'Cozy oranges, warm browns, and soft creams',
    colors: {
      primary: '#F97316',
      secondary: '#D97706',
      accent: '#DC2626',
      background: '#FEF3E2',
      card: '#FFFFFF'
    }
  },
  {
    id: 'soft-pastels',
    name: 'Soft Pastels',
    description: 'Gentle lavender, mint green, and soft pink',
    colors: {
      primary: '#A78BFA',
      secondary: '#6EE7B7',
      accent: '#F9A8D4',
      background: '#FAF5FF',
      card: '#FFFFFF'
    }
  },
  {
    id: 'nature-inspired',
    name: 'Nature Inspired',
    description: 'Forest green, sky blue, and earth tones',
    colors: {
      primary: '#059669',
      secondary: '#0EA5E9',
      accent: '#92400E',
      background: '#F0FDF4',
      card: '#FFFFFF'
    }
  },
  {
    id: 'modern-professional',
    name: 'Modern Professional',
    description: 'Clean slate grays with blue accents',
    colors: {
      primary: '#475569',
      secondary: '#2563EB',
      accent: '#7C3AED',
      background: '#F8FAFC',
      card: '#FFFFFF'
    }
  }
];

const ThemeSelector = () => {
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    return localStorage.getItem('app-theme') || 'fresh-clean';
  });

  useEffect(() => {
    // Apply theme on mount and when it changes
    document.documentElement.setAttribute('data-theme', selectedTheme);
  }, [selectedTheme]);

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    localStorage.setItem('app-theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    
    toast({
      title: "Theme Updated",
      description: "Your color scheme has been changed successfully"
    });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Palette className="w-5 h-5 mr-2 text-primary" />
          Color Scheme
        </CardTitle>
        <p className="text-muted-foreground text-sm mt-2">
          Choose your preferred color scheme for the application
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedTheme === theme.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
              onClick={() => handleThemeChange(theme.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{theme.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{theme.description}</p>
                  <div className="flex gap-2">
                    {Object.entries(theme.colors).map(([key, color]) => (
                      <div
                        key={key}
                        className="w-8 h-8 rounded-md border border-border shadow-sm"
                        style={{ backgroundColor: color }}
                        title={key}
                      />
                    ))}
                  </div>
                </div>
                {selectedTheme === theme.id && (
                  <div className="flex-shrink-0 ml-4">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;
