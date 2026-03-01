
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';

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
  created_at: string;
}

interface AccountCardProps {
  account: DigitalAccount;
  onEdit: (account: DigitalAccount) => void;
  onDelete: (accountId: string) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onEdit, onDelete }) => {
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

              {(account as any).closure_action && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-muted-foreground text-xs font-medium uppercase">Closure action:</span>
                  <p className="text-foreground text-sm mt-1 capitalize">{(account as any).closure_action}</p>
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
