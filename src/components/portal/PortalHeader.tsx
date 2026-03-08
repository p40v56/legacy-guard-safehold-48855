import React from 'react';
import { Calendar, Info, AlertTriangle } from 'lucide-react';
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <h2 className="text-2xl font-bold text-white mb-1">Welcome, {contactName}</h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            {userName} designated you as a trusted contact. Below is the information they authorized you to access.
          </p>
          {switchTriggeredAt && (
            <div className="flex items-center gap-2 mt-3 text-blue-200 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>Switch triggered: {new Date(switchTriggeredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
        <div className="px-6 py-3">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3">
            <Info className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-amber-700 text-xs leading-relaxed">
              You may not be the only person who has received access. Coordinate with others before taking irreversible actions.
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Instructions */}
      {emergencyInstructions && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
          <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Emergency Instructions</h3>
              <p className="text-xs text-red-500">Including physical document locations</p>
            </div>
          </div>
          <div className="px-6 py-4">
            <div 
              className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(emergencyInstructions) }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalHeader;
