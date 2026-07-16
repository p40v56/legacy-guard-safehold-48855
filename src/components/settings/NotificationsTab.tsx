import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Bell, Mail, Phone, Shield } from 'lucide-react';

interface NotificationsTabProps {
  notifications: { email_notifications: boolean; sms_notifications: boolean; emergency_alerts: boolean };
  setNotifications: (n: any) => void;
}

const NotificationsTab = ({ notifications, setNotifications }: NotificationsTabProps) => {
  return (
    <div className="space-y-6 mt-6">
      <Card className="bg-muted/30 border-none rounded-2xl">
        <CardHeader><CardTitle className="text-foreground flex items-center"><Bell className="w-5 h-5 mr-2 text-primary" />Notification Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3"><Mail className="w-5 h-5 text-muted-foreground" /><div><Label className="text-foreground">Email Notifications</Label><p className="text-sm text-muted-foreground">Receive updates via email</p></div></div>
            <Switch checked={notifications.email_notifications} onCheckedChange={checked => setNotifications({...notifications, email_notifications: checked})} />
          </div>
          <Separator />
          <div className="flex items-center justify-between opacity-60">
            <div className="flex items-center space-x-3"><Phone className="w-5 h-5 text-muted-foreground" /><div><Label className="text-foreground">SMS Notifications</Label><p className="text-sm text-muted-foreground">Receive updates via text message</p></div></div>
            <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Coming soon</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between opacity-60">
            <div className="flex items-center space-x-3"><Shield className="w-5 h-5 text-muted-foreground" /><div><Label className="text-foreground">Emergency Alerts</Label><p className="text-sm text-muted-foreground">Critical notifications for emergency situations</p></div></div>
            <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Coming soon</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-none rounded-2xl">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center"><Shield className="w-5 h-5 mr-2 text-primary" />Portal access alerts</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            You are automatically notified by email when a trusted contact accesses their portal (once per 24 hours per contact).
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground font-medium text-sm">Portal access notifications</p>
              <p className="text-sm text-muted-foreground">Email sent when a contact opens their portal</p>
            </div>
            <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Always on</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;
