
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
}

const StatsCard = ({ title, value, icon: Icon, description, trend }: StatsCardProps) => {
  return (
    <Card className="glass group relative overflow-hidden border-border/50 transition-all duration-500 hover:border-primary/50">
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Floating icon decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 group-hover:animate-pulse-subtle" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
          {title}
        </CardTitle>
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Icon className="h-5 w-5 text-primary relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-display font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent transition-all duration-500">
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 transition-colors duration-300 group-hover:text-muted-foreground/80">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-3 pt-3 border-t border-border/50">
            <span className={`text-xs font-semibold ${trend.value >= 0 ? 'text-success' : 'text-destructive'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-2">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;