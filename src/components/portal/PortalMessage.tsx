import React from 'react';
import { MessageSquare } from 'lucide-react';

interface PortalMessageProps {
  userName: string;
  customMessage: string;
}

const PortalMessage: React.FC<PortalMessageProps> = ({ userName, customMessage }) => {
  return (
    <div className="bg-primary/10 backdrop-blur-xl rounded-2xl p-6 border border-primary/30">
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-white">
          Personal Message from {userName}
        </h3>
      </div>
      <div className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">
        {customMessage}
      </div>
    </div>
  );
};

export default PortalMessage;
