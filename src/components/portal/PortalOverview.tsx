import React from 'react';
import { ArrowRight, Phone, Mail, Briefcase } from 'lucide-react';
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

      {/* Key Professionals */}
      {portalData.keyProfessionals && portalData.keyProfessionals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Key Professionals</h3>
          </div>
          <div className="space-y-2.5">
            {portalData.keyProfessionals.map((pro, i) => (
              <div key={i} className="flex items-center gap-3 flex-wrap text-sm bg-gray-50 rounded-lg px-4 py-3">
                <span className="text-gray-900 font-medium">{pro.name}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500 capitalize">{pro.relationship}</span>
                {pro.phone && (
                  <>
                    <span className="text-gray-400">·</span>
                    <a href={`tel:${pro.phone}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                      <Phone className="w-3 h-3" />{pro.phone}
                    </a>
                  </>
                )}
                {pro.email && (
                  <>
                    <span className="text-gray-400">·</span>
                    <a href={`mailto:${pro.email}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                      <Mail className="w-3 h-3" />{pro.email}
                    </a>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
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

      {/* Immediate steps — first 24 hours */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⏱</span>
          <h3 className="text-sm font-semibold text-gray-900">Immediate Steps — First 24 Hours</h3>
        </div>
        <div className="space-y-2">
          {[
            { step: '1', text: 'Contact the GP or hospital to obtain a medical certificate of cause of death' },
            { step: '2', text: 'Register the death at your local register office within 5 days (England/Wales) or 8 days (Scotland)' },
            { step: '3', text: 'Order at least 10 certified copies of the death certificate — most institutions require an original' },
            { step: '4', text: 'Locate the original will — check with the solicitor listed under Key Professionals, or at home in a safe or filing cabinet' },
            { step: '5', text: 'Notify the bank to freeze accounts and prevent further transactions until probate is granted' },
            { step: '6', text: 'Contact HMRC and DWP to stop benefits and tax credits' },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{item.step}</span>
              <span className="text-gray-700">{item.text}</span>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-xs mt-4">This guidance applies to England and Wales. Procedures may differ in Scotland, Northern Ireland, and other jurisdictions.</p>
      </div>

      {/* Help block */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h4 className="text-gray-700 font-medium text-sm mb-2">Not sure where to start?</h4>
        <ol className="text-gray-600 text-sm space-y-1.5 list-decimal list-inside">
          <li>Read the personal message and emergency instructions first</li>
          <li>Order at least 10 certified death certificates from your local register office</li>
          <li>Contact any solicitor or legal professional listed under Key Professionals</li>
          <li>Work through the Urgent Actions checklist — start with insurance</li>
          <li>Notify each financial institution using the details in the Financials section</li>
          <li>Handle digital accounts last — close or memorialize as instructed</li>
        </ol>
      </div>
    </div>
  );
};

export default PortalOverview;
