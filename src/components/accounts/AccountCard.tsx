
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEncryption } from '@/contexts/EncryptionContext';
import { decryptFields } from '@/lib/crypto';

type AccountType = 'email' | 'social' | 'financial' | 'work' | 'entertainment' | 'other';

interface DigitalAccount {
  id: string;
  account_name: string;
  platform: string;
  account_type: AccountType;
  email?: string;
  username?: string;
  website_url?: string;
  notes?: string;
  credentials?: string;
  created_at: string;
  attached_document_ids?: string[] | null;
}

interface AccountCardProps {
  account: DigitalAccount;
  onEdit: (account: DigitalAccount) => void;
  onDelete: (accountId: string) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onEdit, onDelete }) => {
  const [linkedDocs, setLinkedDocs] = useState<{id: string; title: string}[]>([]);
  const navigate = useNavigate();
  const { vaultKey } = useEncryption();

  useEffect(() => {
    const docIds = account.attached_document_ids;
    if (!docIds || docIds.length === 0) return;
    const fetchDocs = async () => {
      const { data } = await supabase
        .from('legacy_documents')
        .select('id, title, title_iv')
        .in('id', docIds);
      if (!data) return;
      const docs = await Promise.all(data.map(async (doc) => {
        let title = doc.title;
        if (vaultKey && doc.title_iv) {
          try {
            const decrypted = await decryptFields(doc, ['title'], vaultKey);
            title = decrypted.title || doc.title;
          } catch { /* use raw */ }
        }
        return { id: doc.id, title };
      }));
      setLinkedDocs(docs);
    };
    fetchDocs();
  }, [account.attached_document_ids, vaultKey]);

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-medium text-foreground">{account.account_name}</h3>
              <Badge variant="secondary" className="text-xs">
                {account.account_type}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Platform:</span>
                <span className="text-foreground">{account.platform}</span>
              </div>
              
              {account.email && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground">{account.email}</span>
                </div>
              )}
              
              {account.username && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="text-foreground">{account.username}</span>
                </div>
              )}
              
              {account.website_url && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Website:</span>
                  <a 
                    href={account.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    {account.website_url}
                  </a>
                </div>
              )}
              
              {account.notes && (
                <div className="mt-3">
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="text-foreground mt-1">{account.notes}</p>
                </div>
              )}

              {account.credentials && (
                <div className="mt-3">
                  <span className="text-muted-foreground text-xs font-medium uppercase">Credentials / Password hint:</span>
                  <p className="text-foreground text-sm mt-1 font-mono">{account.credentials}</p>
                </div>
              )}

              {(account as any).closure_action && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-muted-foreground text-xs font-medium uppercase">Closure action:</span>
                  <p className="text-foreground text-sm mt-1 capitalize">{(account as any).closure_action}</p>
                </div>
              )}

              {linkedDocs.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  {linkedDocs.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => navigate('/documents')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      📄 {doc.title}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-3">
                <span className="text-muted-foreground">Created:</span>
                <span className="text-muted-foreground">
                  {new Date(account.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(account)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(account.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountCard;
