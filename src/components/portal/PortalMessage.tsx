import React from 'react';
import { MessageSquare } from 'lucide-react';

interface PortalMessageProps {
  userName: string;
  customMessage: string;
}

const PortalMessage: React.FC<PortalMessageProps> = ({ userName, customMessage }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 border-l-4 border-l-blue-500">
      <div className="flex items-center gap-3 mb-3">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-semibold text-gray-900">
          Personal Message from {userName}
        </h3>
      </div>
      <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
        {customMessage}
      </div>
    </div>
  );
};

export default PortalMessage;
