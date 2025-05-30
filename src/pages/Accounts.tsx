
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, CreditCard, Edit, Trash2, Eye, EyeOff, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SearchInput from '@/components/ui/search-input';

interface Account {
  id: string;
  platform_name: string;
  username?: string;
  email?: string;
  account_type: string;
  notes?: string;
  is_critical: boolean;
  created_at: string;
}

const Accounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'critical' | 'non-critical' | 'all'>('all');
  const [formData, setFormData] = useState({
    platform_name: '',
    username: '',
    email: '',
    account_type: '',
    notes: '',
    is_critical: false,
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
        description: "Failed to load accounts",
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
        toast({
          title: "Success",
          description: "Account updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('digital_accounts')
          .insert([{ ...formData, user_id: user?.id }]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Account added successfully",
        });
      }

      setShowAddDialog(false);
      setEditingAccount(null);
      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
      toast({
        title: "Error",
        description: "Failed to save account",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('digital_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Account deleted successfully",
      });
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
      platform_name: '',
      username: '',
      email: '',
      account_type: '',
      notes: '',
      is_critical: false,
    });
  };

  const openAddDialog = () => {
    resetForm();
    setEditingAccount(null);
    setShowAddDialog(true);
  };

  const openEditDialog = (account: Account) => {
    setFormData({
      platform_name: account.platform_name,
      username: account.username || '',
      email: account.email || '',
      account_type: account.account_type,
      notes: account.notes || '',
      is_critical: account.is_critical,
    });
    setEditingAccount(account);
    setShowAddDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = 
        account.platform_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.username && account.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        account.account_type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        filterType === 'all' || 
        (filterType === 'critical' && account.is_critical) ||
        (filterType === 'non-critical' && !account.is_critical);
      
      return matchesSearch && matchesFilter;
    });
  }, [accounts, searchTerm, filterType]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <div className="w-8 h-8 bg-emerald-600/20 rounded-lg animate-pulse mx-auto mb-4" />
          <p className="text-slate-400">Loading accounts...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Digital Accounts</h1>
            <p className="text-slate-400">Manage your important digital accounts and credentials</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-500">
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingAccount ? 'Edit Account' : 'Add Digital Account'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="platform_name" className="text-slate-300">Platform Name</Label>
                    <Input
                      id="platform_name"
                      value={formData.platform_name}
                      onChange={(e) => setFormData({...formData, platform_name: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="e.g., Gmail, Facebook, Bank"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="account_type" className="text-slate-300">Account Type</Label>
                    <Select
                      value={formData.account_type}
                      onValueChange={(value) => setFormData({...formData, account_type: value})}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username" className="text-slate-300">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Your username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="account@example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes" className="text-slate-300">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                    placeholder="Additional notes, recovery info, etc."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_critical" className="text-slate-300">Mark as Critical Account</Label>
                    <p className="text-sm text-slate-500">Important accounts that need immediate attention</p>
                  </div>
                  <Switch
                    id="is_critical"
                    checked={formData.is_critical}
                    onCheckedChange={(checked) => setFormData({...formData, is_critical: checked})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 flex-1">
                    {editingAccount ? 'Update Account' : 'Add Account'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
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
              placeholder="Search accounts by platform, username, email..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={filterType} onValueChange={(value: 'critical' | 'non-critical' | 'all') => setFilterType(value)}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Accounts</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="non-critical">Non-Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredAccounts.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="text-center py-8">
                <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchTerm || filterType !== 'all' ? 'No Matching Accounts' : 'No accounts added yet'}
                </h3>
                <p className="text-slate-400 mb-4">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Add your first digital account to get started'
                  }
                </p>
                {!searchTerm && filterType === 'all' && (
                  <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Account
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredAccounts.map((account) => (
              <Card key={account.id} className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{account.platform_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={account.is_critical ? "destructive" : "secondary"}>
                          {account.is_critical ? 'Critical' : 'Standard'}
                        </Badge>
                        <Badge variant="outline" className="text-slate-400">
                          {account.account_type}
                        </Badge>
                        <span className="text-sm text-slate-400">
                          Added {formatDate(account.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(account)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {account.username && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Username:</span>
                        <span className="text-slate-300">{account.username}</span>
                      </div>
                    )}
                    {account.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Email:</span>
                        <span className="text-slate-300">{account.email}</span>
                      </div>
                    )}
                    {account.notes && (
                      <div className="mt-3">
                        <span className="text-slate-400 text-sm">Notes:</span>
                        <p className="text-slate-300 text-sm mt-1">{account.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Accounts;
