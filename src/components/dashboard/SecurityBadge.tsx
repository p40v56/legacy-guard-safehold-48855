import { useState } from 'react';
import { ShieldCheck, Lock, Eye, Key, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const SecurityBadge = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Badge
        variant="outline"
        className="cursor-pointer gap-1.5 px-3 py-1.5 rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        onClick={() => setOpen(true)}
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        Zero-Knowledge Encrypted
      </Badge>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Zero-Knowledge Encryption
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-card-foreground">Encrypted in your browser</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your data is encrypted before it reaches our servers. We never see your plaintext data.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Eye className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-card-foreground">We can't read your data</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  LegacyVault cannot read your documents, account details, or messages. Even our team has no access.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Key className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-card-foreground">Zero-knowledge encryption</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You can reset your password via email at any time. However, no one — including us — can ever access or decrypt your vault data. Your encryption keys never leave your device.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-card-foreground">Secure contact sharing</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Each trusted contact receives a unique access key by email when your switch activates. Only they can decrypt what you shared with them.
                </p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-3 mt-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                LegacyVault uses AES-256-GCM encryption with PBKDF2 key derivation (310,000 iterations). 
                Your master key is derived from your password and never stored. All encryption happens exclusively in your browser using the Web Crypto API.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SecurityBadge;
