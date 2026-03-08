import React from 'react';
import { ArrowRight, Phone, Mail, Briefcase, Landmark, FileText, Globe, Clock, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PortalData } from '@/pages/Portal';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalMessage from '@/components/portal/PortalMessage';
import PortalUrgentActions from '@/components/portal/PortalUrgentActions';

interface PortalOverviewProps {
  portalData: PortalData;
}

const SECTION_LINK_ICONS: Record<string, React.ReactNode> = {
  financials: <Landmark className="w-5 h-5" />,
  documents: <FileText className="w-5 h-5" />,
  accounts: <Globe className="w-5 h-5" />,
};

const SECTION_LINK_COLORS: Record<string, { bg: string; icon: string; border: string }> = {
  financials: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
  documents: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
  accounts: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
};

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
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Key Professionals</h3>
          </div>
          <div className="space-y-2.5">
            {portalData.keyProfessionals.map((pro, i) => (
              <div key={i} className="flex items-center gap-3 flex-wrap text-sm bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                <span className="text-gray-900 font-medium">{pro.name}</span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-500 capitalize">{pro.relationship}</span>
                {pro.phone && (
                  <>
                    <span className="text-gray-300">·</span>
                    <a href={`tel:${pro.phone}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                      <Phone className="w-3 h-3" />{pro.phone}
                    </a>
                  </>
                )}
                {pro.email && (
                  <>
                    <span className="text-gray-300">·</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {links.map(l => {
            const colors = SECTION_LINK_COLORS[l.to] || { bg: 'bg-gray-50', icon: 'text-gray-600', border: 'border-gray-100' };
            return (
              <button
                key={l.to}
                onClick={() => navigate(`/portal/${token}/${l.to}`)}
                className={`flex items-center gap-3 px-4 py-4 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all text-left group`}
              >
                <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center shrink-0 border ${colors.border}`}>
                  <span className={colors.icon}>{SECTION_LINK_ICONS[l.to]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{l.count} {l.label}</p>
                  <p className="text-xs text-gray-400">View details →</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Immediate steps — first 24 hours */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Immediate Steps — First 24 Hours</h3>
            <p className="text-xs text-gray-400">Critical actions to take right away</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {[
            { step: '1', text: 'Contact the GP or hospital to obtain a medical certificate of cause of death' },
            { step: '2', text: 'Register the death at your local register office within 5 days (England/Wales) or 8 days (Scotland)' },
            { step: '3', text: 'Order at least 10 certified copies of the death certificate — most institutions require an original' },
            { step: '4', text: 'Locate the original will — check with the solicitor listed under Key Professionals, or at home in a safe or filing cabinet' },
            { step: '5', text: 'Notify the bank to freeze accounts and prevent further transactions until probate is granted' },
            { step: '6', text: 'Contact HMRC and DWP to stop benefits and tax credits' },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3 text-sm p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {item.step}
              </div>
              <span className="text-gray-700 leading-relaxed">{item.text}</span>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-xs mt-4 pl-9">This guidance applies to England and Wales. Procedures may differ in Scotland, Northern Ireland, and other jurisdictions.</p>
      </div>

      {/* Help block */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-gray-500" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900">Not sure where to start?</h4>
        </div>
        <ol className="text-gray-600 text-sm space-y-2 pl-1">
          {[
            'Read the personal message and emergency instructions first',
            'Order at least 10 certified death certificates from your local register office',
            'Contact any solicitor or legal professional listed under Key Professionals',
            'Work through the Urgent Actions checklist — start with insurance',
            'Notify each financial institution using the details in the Financials section',
            'Handle digital accounts last — close or memorialize as instructed',
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default PortalOverview;
