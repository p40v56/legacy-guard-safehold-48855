import React from 'react';
import { Calendar, Info } from 'lucide-react';
import DOMPurify from 'dompurify';

interface PortalHeaderProps {
  contactName: string;
  userName: string;
  switchTriggeredAt: string | null;
  emergencyInstructions: string | null;
}

const PortalHeader: React.FC<PortalHeaderProps> = ({ contactName, userName, switchTriggeredAt, emergencyInstructions }) => {
  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome, {contactName}</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {userName} designated you as a trusted contact. Below is the information they authorized you to access.
        </p>
        {switchTriggeredAt && (
          <div className="flex items-center gap-2 mt-3 text-gray-500 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>Switch triggered: {new Date(switchTriggeredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}

        {/* Others notified */}
        <div className="flex items-start gap-2 mt-4 bg-gray-50 rounded-lg p-3">
          <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
          <p className="text-gray-500 text-xs leading-relaxed">
            You may not be the only person who has received access. Coordinate with others before taking irreversible actions.
          </p>
        </div>
      </div>

      {/* Emergency Instructions */}
      {emergencyInstructions && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg">🚨</span>
            <h3 className="text-base font-semibold text-gray-900">Emergency Instructions</h3>
          </div>
          <div 
            className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(emergencyInstructions) }}
          />
        </div>
      )}
    </div>
  );
};

export default PortalHeader;
