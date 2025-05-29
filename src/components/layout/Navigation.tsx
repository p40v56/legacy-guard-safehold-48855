
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

interface NavigationProps {
  onSignIn: () => void;
}

const Navigation = ({ onSignIn }: NavigationProps) => {
  return (
    <nav className="relative z-10 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">LegacyVault</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-blue-200 hover:text-white transition-colors">Features</a>
            <a href="#security" className="text-blue-200 hover:text-white transition-colors">Security</a>
            <a href="#pricing" className="text-blue-200 hover:text-white transition-colors">Pricing</a>
            <a href="#support" className="text-blue-200 hover:text-white transition-colors">Support</a>
          </div>

          <Button 
            onClick={onSignIn}
            variant="outline" 
            className="border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10"
          >
            Sign In
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
