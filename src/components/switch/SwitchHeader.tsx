
import { Badge } from '@/components/ui/badge';
import { Activity, Shield } from 'lucide-react';

interface SwitchHeaderProps {
  isActive: boolean;
}

const SwitchHeader = ({ isActive }: SwitchHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dead Man's Switch</h1>
        <p className="text-slate-400">
          Automated safety monitoring system
        </p>
      </div>
      {isActive ? (
        <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
          <Activity className="w-4 h-4 mr-2" />
          Active
        </Badge>
      ) : (
        <Badge className="bg-red-600/20 text-red-400 border-red-600/30">
          <Shield className="w-4 h-4 mr-2" />
          Inactive
        </Badge>
      )}
    </div>
  );
};

export default SwitchHeader;
