import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, History, Monitor, Mail, Phone } from 'lucide-react';
import { formatDateEU } from '@/utils/dateUtils';

interface CheckInEntry {
  id: string;
  checked_in_at: string;
  method: string;
}

const methodIcons: Record<string, React.ReactNode> = {
  web: <Monitor className="w-4 h-4 text-primary" />,
  email: <Mail className="w-4 h-4 text-primary" />,
  sms: <Phone className="w-4 h-4 text-primary" />,
};

const CheckInHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<CheckInEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user || !isOpen) return;
    supabase
      .from('check_in_history')
      .select('id, checked_in_at, method')
      .eq('user_id', user.id)
      .order('checked_in_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setHistory(data);
      });
  }, [user, isOpen]);

  return (
    <div className="bg-muted/30 rounded-2xl p-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <History className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-medium text-card-foreground">Check-in History</h3>
                <p className="text-sm text-muted-foreground">Last 10 check-ins</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-4 space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No check-ins recorded yet.</p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 py-2 px-3 bg-card/50 rounded-xl">
                  {methodIcons[entry.method] || methodIcons.web}
                  <span className="text-sm text-card-foreground flex-1">
                    {entry.method === 'web' ? 'Web check-in' : entry.method === 'email' ? 'Email check-in' : 'SMS check-in'}
                  </span>
                  <span className="text-sm text-muted-foreground">{formatDateEU(entry.checked_in_at)}</span>
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default CheckInHistory;
