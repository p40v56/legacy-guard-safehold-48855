import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PortalSection {
  id: string;
  label: string;
}

interface PortalNavigationProps {
  sections: PortalSection[];
  activeSection: string;
  onNavigate: (id: string) => void;
}

const PortalNavigation: React.FC<PortalNavigationProps> = ({ sections, activeSection, onNavigate }) => {
  const isMobile = useIsMobile();

  if (sections.length <= 1) return null;

  // Mobile: horizontal scrolling tabs
  if (isMobile) {
    return (
      <div className="sticky top-0 z-20 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="flex overflow-x-auto no-scrollbar px-4">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => onNavigate(s.id)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === s.id
                  ? 'text-primary border-primary'
                  : 'text-white/50 border-transparent hover:text-white/70'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Desktop: sticky sidebar
  return (
    <nav className="sticky top-8 w-48 shrink-0 space-y-1 hidden lg:block">
      {sections.map(s => (
        <button
          key={s.id}
          onClick={() => onNavigate(s.id)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            activeSection === s.id
              ? 'bg-primary/20 text-primary font-medium'
              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
};

export default PortalNavigation;
