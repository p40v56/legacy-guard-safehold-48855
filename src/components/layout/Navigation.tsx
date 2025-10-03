
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Menu, X } from 'lucide-react';

interface NavigationProps {
  onSignIn: () => void;
}

const Navigation = ({ onSignIn }: NavigationProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Features', href: '#features' },
    { name: 'Security', href: '#security' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Support', href: '#support' }
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
      isScrolled 
        ? 'glass-strong shadow-2xl border-b border-border/50' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary to-accent rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg group-hover:shadow-primary/50">
                <Shield className="w-7 h-7 text-white animate-pulse-subtle" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl opacity-0 group-hover:opacity-50 blur-xl transition-all duration-500 animate-pulse-subtle"></div>
            </div>
            <span className="text-2xl font-display font-bold gradient-text-2 transition-all duration-500">
              LegacyVault
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item, index) => (
              <a 
                key={item.name}
                href={item.href} 
                className={`relative px-4 py-2 text-muted-foreground hover:text-foreground transition-all duration-300 group rounded-lg animate-fade-in font-medium`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="relative z-10">{item.name}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
                <div className="absolute bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </a>
            ))}
          </div>

          {/* Desktop Sign In Button */}
          <div className="hidden md:block animate-fade-in-up">
            <Button 
              onClick={onSignIn}
              variant="glass"
              className="font-semibold"
            >
              <span className="relative z-10 gradient-text">Sign In</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-500 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}>
          <div className="glass-strong rounded-2xl p-4 space-y-2 border border-border/50">
            {navItems.map((item, index) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block text-muted-foreground hover:text-foreground transition-all duration-300 py-3 px-4 hover:bg-accent/50 rounded-xl animate-fade-in-up font-medium`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {item.name}
              </a>
            ))}
            <div className="pt-2 border-t border-border/50">
              <Button 
                onClick={() => {
                  onSignIn();
                  setIsMobileMenuOpen(false);
                }}
                variant="glass"
                className="w-full font-semibold"
              >
                <span className="gradient-text">Sign In</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;