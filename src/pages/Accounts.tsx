import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Key, Plus, Edit, Trash2, Eye, EyeOff, ExternalLink, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SearchInput from '@/components/ui/search-input';

type AccountType = 'email' | 'social_media' | 'financial' | 'subscription' | 'gaming' | 'work' | 'other';

interface DigitalAccount {
  id: string;
  account_name: string;
  platform: string;
  account_type: AccountType;
  email: string | null;
  username: string | null;
  website_url: string | null;
  notes: string | null;
  created_at: string;
}

const Accounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<DigitalAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<DigitalAccount | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<AccountType | 'all'>('all');

  const [formData, setFormData] = useState({
    account_name: '',
    platform: '',
    account_type: 'other' as AccountType,
    email: '',
    username: '',
    website_url: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('digital_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load digital accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAccount) {
        const { error } = await supabase
          .from('digital_accounts')
          .update(formData)
          .eq('id', editingAccount.id);

        if (error) throw error;
        toast({ title: "Account Updated", description: "Digital account has been updated successfully" });
      } else {
        const { error } = await supabase
          .from('digital_accounts')
          .insert({
            ...formData,
            user_id: user?.id
          });

        if (error) throw error;
        toast({ title: "Account Added", description: "Digital account has been added successfully" });
      }

      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
      toast({
        title: "Error",
        description: "Failed to save digital account",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('digital_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Account Deleted", description: "Digital account has been deleted" });
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      account_name: '',
      platform: '',
      account_type: 'other',
      email: '',
      username: '',
      website_url: '',
      notes: ''
    });
    setEditingAccount(null);
    setShowAddDialog(false);
  };

  const startEdit = (account: DigitalAccount) => {
    setFormData({
      account_name: account.account_name,
      platform: account.platform,
      account_type: account.account_type,
      email: account.email || '',
      username: account.username || '',
      website_url: account.website_url || '',
      notes: account.notes || ''
    });
    setEditingAccount(account);
    setShowAddDialog(true);
  };

  const getAccountTypeColor = (type: AccountType) => {
    const colors = {
      email: 'bg-blue-500/20 text-blue-400',
      social_media: 'bg-purple-500/20 text-purple-400',
      financial: 'bg-green-500/20 text-green-400',
      subscription: 'bg-orange-500/20 text-orange-400',
      gaming: 'bg-red-500/20 text-red-400',
      work: 'bg-indigo-500/20 text-indigo-400',
      other: 'bg-gray-500/20 text-gray-400'
    };
    return colors[type];
  };

  const getAccountTypeLabel = (type: AccountType) => {
    const labels = {
      email: 'Email',
      social_media: 'Social Media',
      financial: 'Financial',
      subscription: 'Subscription',
      gaming: 'Gaming',
      work: 'Work',
      other: 'Other'
    };
    return labels[type];
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = 
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (account.username && account.username.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterType === 'all' || account.account_type === filterType;
      
      return matchesSearch && matchesFilter;
    });
  }, [accounts, searchTerm, filterType]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Key className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-400" />
            <p className="text-slate-400">Loading accounts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Digital Accounts</h1>
            <p className="text-slate-400">
              Manage your digital accounts and credentials securely
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => resetForm()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingAccount ? 'Edit Account' : 'Add Digital Account'}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  {editingAccount ? 'Update account information' : 'Add a new digital account to secure'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Account Name</Label>
                  <Input
                    value={formData.account_name}
                    onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                    placeholder="My Gmail Account"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Platform</Label>
                  <Input
                    value={formData.platform}
                    onChange={(e) => setFormData({...formData, platform: e.target.value})}
                    placeholder="Gmail, Facebook, Bank of America"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Account Type</Label>
                  <Select
                    value={formData.account_type}
                    onValueChange={(value: AccountType) => 
                      setFormData({...formData, account_type: value})
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="user@example.com"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Username</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="username"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Website URL</Label>
                  <Input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                    placeholder="https://example.com"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes or instructions"
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500">
                    {editingAccount ? 'Update' : 'Add'} Account
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search accounts, platforms, emails..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={filterType} onValueChange={(value: AccountType | 'all') => setFilterType(value)}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Accounts Grid */}
        {filteredAccounts.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm || filterType !== 'all' ? 'No Matching Accounts' : 'No Digital Accounts'}
              </h3>
              <p className="text-slate-400 text-center mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start by adding your first digital account to secure your digital legacy.'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <Button 
                  onClick={() => setShowAddDialog(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Account
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAccounts.map((account) => (
              <Card key={account.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg">{account.account_name}</CardTitle>
                      <CardDescription className="text-slate-400">
                        {account.platform}
                      </CardDescription>
                    </div>
                    <Badge className={getAccountTypeColor(account.account_type)}>
                      {getAccountTypeLabel(account.account_type)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {account.email && (
                    <div>
                      <Label className="text-xs text-slate-400">Email</Label>
                      <p className="text-sm text-white">{account.email}</p>
                    </div>
                  )}
                  
                  {account.username && (
                    <div>
                      <Label className="text-xs text-slate-400">Username</Label>
                      <p className="text-sm text-white">{account.username}</p>
                    </div>
                  )}

                  {account.website_url && (
                    <div>
                      <Label className="text-xs text-slate-400">Website</Label>
                      <a 
                        href={account.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center"
                      >
                        Visit Site
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}

                  {account.notes && (
                    <div>
                      <Label className="text-xs text-slate-400">Notes</Label>
                      <p className="text-sm text-slate-300 line-clamp-2">{account.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(account)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteAccount(account.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Accounts;
