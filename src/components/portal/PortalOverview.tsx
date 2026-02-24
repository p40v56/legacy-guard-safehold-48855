import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PortalData } from '@/pages/Portal';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalMessage from '@/components/portal/PortalMessage';
import PortalUrgentActions from '@/components/portal/PortalUrgentActions';

interface PortalOverviewProps {
  portalData: PortalData;
}

const PortalOverview: React.FC<PortalOverviewProps> = ({ portalData }) => {
  const { token } = useParams();
  const navigate = useNavigate();
  const isFreePortal = portalData.userPlan === 'free';

  const links: { label: string; count: number; to: string }[] = [];
  if (portalData.financialAssets.length > 0) links.push({ label: 'financial assets', count: portalData.financialAssets.length, to: 'financials' });
  if (portalData.documents.length > 0) links.push({ label: 'documents', count: portalData.documents.length, to: 'documents' });
  if (portalData.accounts.length > 0) links.push({ label: 'digital accounts', count: portalData.accounts.length, to: 'accounts' });

  return (
    <div className="space-y-6">
      <PortalHeader
        contactName={portalData.contactName}
        userName={portalData.userName}
        switchTriggeredAt={portalData.switchTriggeredAt}
        emergencyInstructions={portalData.emergencyInstructions}
      />

      {portalData.customMessage && (
        <PortalMessage userName={portalData.userName} customMessage={portalData.customMessage} />
      )}

      {isFreePortal && links.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
          <p className="text-gray-500 text-sm">
            {portalData.userName} shared a message with you. For more detailed information, their account plan does not include extended portal access.
          </p>
        </div>
      )}

      {portalData.financialAssets.length > 0 && (
        <PortalUrgentActions financialAssets={portalData.financialAssets} token={token} />
      )}

      {/* Navigation shortcuts */}
      {links.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Sections</h3>
          <div className="space-y-2">
            {links.map(l => (
              <button
                key={l.to}
                onClick={() => navigate(`/portal/${token}/${l.to}`)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <span className="text-gray-700 text-sm">
                  View <span className="font-medium">{l.count}</span> {l.label}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalOverview;
