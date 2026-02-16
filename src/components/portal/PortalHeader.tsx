import React from 'react';
import { Shield, Calendar } from 'lucide-react';

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
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Welcome, {contactName}</h2>
            <p className="text-white/50 text-xs">Secure Document Portal</p>
          </div>
        </div>
        <p className="text-white/70 text-sm leading-relaxed">
          {userName} designated you as a trusted contact. Below is the information they authorized you to access.
        </p>
        {switchTriggeredAt && (
          <div className="flex items-center gap-2 mt-3 text-white/50 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>Switch triggered: {new Date(switchTriggeredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      {/* Emergency Instructions */}
      {emergencyInstructions && (
        <div className="bg-destructive/10 backdrop-blur-xl rounded-2xl p-6 border border-destructive/30">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg">🚨</span>
            <h3 className="text-base font-semibold text-white">Emergency Instructions</h3>
          </div>
          <div 
            className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: emergencyInstructions }}
          />
        </div>
      )}
    </div>
  );
};

export default PortalHeader;
