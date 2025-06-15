
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const SwitchInfoCard = () => {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-400" />
          How It Works
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-slate-300">
        <p>
          Your Dead Man's Switch monitors your regular check-ins. You can choose between frequency-based 
          scheduling or set a specific deadline date and time.
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Frequency Mode:</strong> Check-ins reset based on your chosen schedule (daily, weekly, etc.)</li>
          <li><strong>Custom Mode:</strong> Set a specific date and time for your deadline</li>
          <li>Grace period applies only to frequency-based schedules</li>
          <li>Perform manual check-ins anytime to update your status</li>
          <li>Emergency contacts are notified if deadlines are missed</li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default SwitchInfoCard;
