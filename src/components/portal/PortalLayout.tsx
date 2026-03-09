import React from 'react';
import { Shield, Printer, LayoutDashboard, Landmark, FileText, Globe } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { PortalData } from '@/pages/Portal';
import { useIsMobile } from '@/hooks/use-mobile';

interface PortalLayoutProps {
  portalData: PortalData;
  token: string;
  children: React.ReactNode;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  overview: <LayoutDashboard className="w-4 h-4" />,
  financials: <Landmark className="w-4 h-4" />,
  documents: <FileText className="w-4 h-4" />,
  accounts: <Globe className="w-4 h-4" />,
};

const PortalLayout: React.FC<PortalLayoutProps> = ({ portalData, token, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const sections = React.useMemo(() => {
    const s: { id: string; label: string }[] = [{ id: 'overview', label: 'Overview' }];
    if (portalData.financialAssets.length > 0) s.push({ id: 'financials', label: 'Financials' });
    if (portalData.documents.length > 0) s.push({ id: 'documents', label: 'Documents' });
    if (portalData.accounts.length > 0) s.push({ id: 'accounts', label: 'Accounts' });
    return s;
  }, [portalData]);

  const currentSection = React.useMemo(() => {
    const path = location.pathname;
    for (const s of sections) {
      if (path.endsWith(`/${s.id}`)) return s.id;
    }
    return 'overview';
  }, [location.pathname, sections]);

  const goTo = (id: string) => navigate(`/portal/${token}/${id}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
         <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shadow-blue-200/50">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-gray-900">LegacyVault <span className="text-gray-400 font-normal">· Secure Portal</span></h1>
            <p className="text-xs text-gray-500">
              Shared by <span className="text-gray-700 font-medium">{portalData.userName}</span>
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="print:hidden inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      {isMobile && sections.length > 1 && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="relative">
            <div className="flex overflow-x-auto no-scrollbar px-2">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => goTo(s.id)}
                  className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    currentSection === s.id
                      ? 'text-blue-700 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  {SECTION_ICONS[s.id]}
                  {s.label}
                </button>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 flex gap-8">
        {/* Desktop sidebar */}
        {!isMobile && sections.length > 1 && (
          <nav className="sticky top-8 w-52 shrink-0 space-y-1 hidden md:block self-start">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 space-y-0.5">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => goTo(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2.5 ${
                    currentSection === s.id
                      ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className={currentSection === s.id ? 'text-blue-600' : 'text-gray-400'}>{SECTION_ICONS[s.id]}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {children}

          {/* Footer */}
          <div className="text-center py-10 mt-8 space-y-1">
            <p className="text-gray-400 text-xs">
              This is a secure, private portal. The information shown here is confidential.
            </p>
            <p className="text-gray-300 text-xs">
              If you need help or have questions, contact <a href="mailto:support@legacyvault.app" className="text-gray-400 underline hover:text-gray-500">support@legacyvault.app</a>.
            </p>
            <p className="text-gray-300 text-xs">
              <a href="/terms" className="text-gray-400 underline hover:text-gray-500">Terms</a>
              {' · '}
              <a href="/privacy" className="text-gray-400 underline hover:text-gray-500">Privacy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalLayout;
