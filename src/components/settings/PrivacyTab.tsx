import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, AlertTriangle, Download, Lock, FileText, Trash2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface PrivacyTabProps {
  vaultKey: CryptoKey | null;
  autoDeleteEnabled: boolean;
  autoDeleteDays: number | null;
  setAutoDeleteEnabled: (v: boolean) => void;
  handleAutoDeleteChange: (days: number | null) => void;
  exporting: boolean;
  handleExportData: () => void;
  handleExportReadable: () => void;
  lastSignIn: string | null;
  accountCreatedAt: string | null;
  passwordChangedAt: string | null;
  formatActivityDate: (d: string | null) => string;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (v: string) => void;
  deletePassword: string;
  setDeletePassword: (v: string) => void;
  deletingAccount: boolean;
  handleDeleteAccount: () => void;
}

const PrivacyTab = ({
  vaultKey,
  autoDeleteEnabled, autoDeleteDays, setAutoDeleteEnabled, handleAutoDeleteChange,
  exporting, handleExportData, handleExportReadable,
  lastSignIn, accountCreatedAt, passwordChangedAt, formatActivityDate,
  showDeleteConfirm, setShowDeleteConfirm,
  deleteConfirmText, setDeleteConfirmText,
  deletePassword, setDeletePassword,
  deletingAccount, handleDeleteAccount,
}: PrivacyTabProps) => {
  return (
    <div className="space-y-6 mt-6">
      <Card className="bg-muted/30 border-none rounded-2xl">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center"><Clock className="w-5 h-5 mr-2 text-primary" />Data Lifecycle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Optionally schedule automatic deletion of your vault after your switch has fired. This gives your contacts time to access their portal before all data is permanently removed.
          </p>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground font-medium">Auto-delete after switch fires</Label>
              <p className="text-xs text-muted-foreground">Your account and all data will be permanently deleted after this period</p>
            </div>
            <Switch
              checked={autoDeleteEnabled}
              onCheckedChange={(checked) => {
                setAutoDeleteEnabled(checked);
                handleAutoDeleteChange(checked ? 180 : null);
              }}
            />
          </div>

          {autoDeleteEnabled && (
            <div className="space-y-3 pl-0">
              <div className="space-y-2">
                <Label className="text-foreground">Delete after</Label>
                <Select value={(autoDeleteDays || 180).toString()} onValueChange={(v) => handleAutoDeleteChange(parseInt(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days after switch fires</SelectItem>
                    <SelectItem value="60">60 days after switch fires</SelectItem>
                    <SelectItem value="90">90 days after switch fires</SelectItem>
                    <SelectItem value="180">180 days after switch fires</SelectItem>
                    <SelectItem value="365">1 year after switch fires</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  This deletion is permanent and cannot be undone. Make sure your contacts have enough time to download what they need.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-none rounded-2xl">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center"><Download className="w-5 h-5 mr-2 text-primary" />Export Your Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download a complete copy of all your data including contacts, documents, accounts, and financial assets. Data is decrypted locally before export.
          </p>
          {!vaultKey && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
              <Lock className="w-4 h-4 text-warning shrink-0" />
              <p className="text-xs text-muted-foreground">Your vault is locked. Unlock it first to export your data.</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExportData} disabled={exporting || !vaultKey} variant="default">
              {exporting ? (<><LoadingSpinner size="sm" className="mr-2" />Exporting...</>) : (<><Download className="w-4 h-4 mr-2" />Download as JSON</>)}
            </Button>
            <Button onClick={handleExportReadable} disabled={exporting || !vaultKey} variant="outline">
              <FileText className="w-4 h-4 mr-2" />Download as readable text
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-none rounded-2xl">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center"><Clock className="w-5 h-5 mr-2 text-primary" />Recent account activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Last sign in</span>
              <span className="text-sm text-foreground font-medium">{formatActivityDate(lastSignIn)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Password last changed</span>
              <span className="text-sm text-foreground font-medium">{passwordChangedAt ? formatActivityDate(passwordChangedAt) : 'Never'}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Account created</span>
              <span className="text-sm text-foreground font-medium">{formatActivityDate(accountCreatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-none rounded-2xl border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center"><Trash2 className="w-5 h-5 mr-2" />Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
            {!showDeleteConfirm ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button onClick={() => setShowDeleteConfirm(true)} variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 rounded-xl">
                  <Trash2 className="w-4 h-4 mr-2" />Delete my account
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-destructive font-medium">
                  This will permanently delete all your data. This cannot be undone.
                </p>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm:</p>
                  <Input
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="bg-background border-destructive/30 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Enter your password to confirm</Label>
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Your current password"
                    className="bg-background border-destructive/30 rounded-xl"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeletePassword(''); }} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleteConfirmText !== 'DELETE' || !deletePassword || deletingAccount}
                    onClick={handleDeleteAccount}
                  >
                    {deletingAccount ? <LoadingSpinner size="sm" className="mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Delete permanently
                  </Button>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Your encryption keys are derived from your password. Once deleted, your data cannot be recovered by anyone.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyTab;
