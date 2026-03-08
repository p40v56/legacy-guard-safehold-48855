import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  LayoutDashboard, 
  Timer, 
  Monitor, 
  Users, 
  Landmark,
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  MessageCircle,
  ShieldCheck,
  Crown
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const { isAdmin, plan } = usePlan();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Switch', href: '/switch', icon: Timer },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Accounts', href: '/accounts', icon: Monitor },
    { name: 'Financial', href: '/financials', icon: Landmark },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 lg:px-6 lg:py-4 bg-black/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
            <span className="text-lg lg:text-xl font-semibold text-white">LegacyVault</span>
            {plan !== 'free' && (
              <Crown className="w-4 h-4 text-yellow-400" />
            )}
          </div>
          
          {/* Desktop user info */}
          <div className="hidden lg:flex items-center gap-4">
            <span className="text-white/80 text-sm">{user?.email}</span>
            {isAdmin && (
              <Link to="/admin">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-16 left-4 right-4 glass-strong rounded-2xl p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-card-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    location.pathname === '/admin' 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-card-foreground hover:bg-muted'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-medium">Admin</span>
                </Link>
              )}
              <div className="border-t border-border pt-2 mt-2">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Log out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-20 pb-28 px-4 lg:px-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="glass-strong rounded-3xl p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Floating Navigation */}
      <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="floating-nav px-2 py-2 flex items-center gap-1">
          {navigationItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-card-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
          <Link
            to="/settings"
            className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full transition-all duration-200 ${
              location.pathname === '/settings' 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:text-card-foreground hover:bg-muted'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden lg:inline text-sm font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Support Button */}
      <div className="fixed bottom-6 right-4 lg:right-6 z-50">
        <Button 
          variant="outline" 
          size="sm"
          className="rounded-full bg-white/95 border-none shadow-lg hover:shadow-xl text-card-foreground"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Support</span>
        </Button>
      </div>
    </div>
  );
};

export default DashboardLayout;
