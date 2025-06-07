
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
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-medium text-white">{account.account_name}</h3>
              <Badge variant="secondary" className="text-xs">
                {account.account_type}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Platform:</span>
                <span className="text-white">{account.platform}</span>
              </div>
              
              {account.email && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-white">{account.email}</span>
                </div>
              )}
              
              {account.username && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Username:</span>
                  <span className="text-white">{account.username}</span>
                </div>
              )}
              
              {account.website_url && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Website:</span>
                  <a 
                    href={account.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    {account.website_url}
                  </a>
                </div>
              )}
              
              {account.notes && (
                <div className="mt-3">
                  <span className="text-slate-400">Notes:</span>
                  <p className="text-white mt-1">{account.notes}</p>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-3">
                <span className="text-slate-400">Created:</span>
                <span className="text-slate-300">
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
              className="text-slate-400 hover:text-white"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(account.id)}
              className="text-slate-400 hover:text-red-400"
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
