
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import SearchInput from '@/components/ui/search-input';

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

const Accounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<DigitalAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<DigitalAccount | null>(null);
  const [formData, setFormData] = useState({
    account_name: '',
    platform: '',
    account_type: 'other' as AccountType,
    email: '',
    username: '',
    website_url: '',
    notes: '',
  });

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const accountName = (account.account_name || '').toLowerCase();
      const platform = (account.platform || '').toLowerCase();
      const email = (account.email || '').toLowerCase();
      const username = (account.username || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = !searchTerm || 
        accountName.includes(searchLower) ||
        platform.includes(searchLower) ||
        email.includes(searchLower) ||
        username.includes(searchLower);
      
      const matchesFilter = filterType === 'all' || account.account_type === filterType;
      
      return matchesSearch && matchesFilter;
    });
  }, [accounts, searchTerm, filterType]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    try {
      // Mock data - in a real app this would come from your backend
      const mockAccounts: DigitalAccount[] = [
        {
          id: '1',
          account_name: 'Personal Gmail',
          platform: 'Gmail',
          account_type: 'email',
          email: 'test@test.com',
          website_url: 'https://gmail.com',
          notes: 'Primary email account',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          account_name: 'Social Media',
          platform: 'Facebook',
          account_type: 'social',
          username: 'testuser',
          website_url: 'https://facebook.com',
          created_at: new Date().toISOString(),
        }
      ];
      setAccounts(mockAccounts);
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
        // Mock update
        setAccounts(prev => prev.map(account => 
          account.id === editingAccount.id 
            ? { ...account, ...formData }
            : account
        ));
        
        toast({
          title: "Success",
          description: "Account updated successfully",
        });
      } else {
        // Mock create
        const newAccount: DigitalAccount = {
          ...formData,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
        };
        setAccounts(prev => [...prev, newAccount]);
        
        toast({
          title: "Success",
          description: "Account added successfully",
        });
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving account:', error);
      toast({
        title: "Error",
        description: "Failed to save account",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (account: DigitalAccount) => {
    setFormData({
      account_name: account.account_name,
      platform: account.platform,
      account_type: account.account_type,
      email: account.email || '',
      username: account.username || '',
      website_url: account.website_url || '',
      notes: account.notes || '',
    });
    setEditingAccount(account);
    setShowAddForm(true);
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    
    try {
      setAccounts(prev => prev.filter(account => account.id !== accountId));
      
      toast({
        title: "Success",
        description: "Account deleted successfully",
      });
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
      notes: '',
    });
    setShowAddForm(false);
    setEditingAccount(null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" className="text-emerald-400 mx-auto mb-4" />
            <p className="text-slate-400">Loading accounts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Digital Accounts</h1>
            <p className="text-slate-400">Manage your digital accounts and credentials</p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search accounts..."
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="social">Social Media</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-emerald-400" />
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-200">Account Name *</Label>
                    <Input
                      value={formData.account_name}
                      onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="My Gmail Account"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200">Platform *</Label>
                    <Input
                      value={formData.platform}
                      onChange={(e) => setFormData({...formData, platform: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Gmail, Facebook, etc."
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-200">Account Type</Label>
                    <Select 
                      value={formData.account_type} 
                      onValueChange={(value: AccountType) => setFormData({...formData, account_type: value})}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-200">Website URL</Label>
                    <Input
                      value={formData.website_url}
                      onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-200">Email</Label>
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="user@example.com"
                      type="email"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200">Username</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="username"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-200">Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                    placeholder="Additional notes about this account..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500">
                    {editingAccount ? 'Update Account' : 'Add Account'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Accounts List */}
        <div className="grid gap-4">
          {filteredAccounts.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-8 text-center">
                <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No accounts found</h3>
                <p className="text-slate-400 mb-4">
                  {searchTerm || filterType !== 'all' 
                    ? 'No accounts match your search criteria.' 
                    : 'Get started by adding your first digital account.'}
                </p>
                {(!searchTerm && filterType === 'all') && (
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Account
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredAccounts.map((account) => (
              <Card key={account.id} className="bg-slate-800/50 border-slate-700">
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
                        onClick={() => handleEdit(account)}
                        className="text-slate-400 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
