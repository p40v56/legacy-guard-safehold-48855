import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Edit, Trash2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import SearchInput from '@/components/ui/search-input';

type AccountType = 'social' | 'financial' | 'email' | 'cloud' | 'subscription' | 'other';
type ImportanceLevel = 'low' | 'medium' | 'high' | 'critical';
type ClosureAction = 'delete' | 'memorialize' | 'transfer' | 'download';

interface AccountFormData {
  platform: string;
  username: string;
  email: string;
  account_type: AccountType;
  importance: ImportanceLevel;
  closure_action: ClosureAction;
  notes: string;
}

const Accounts = () => {
  const { user } = useAuth();
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<AccountType | 'all'>('all');
  const [formData, setFormData] = useState<AccountFormData>({
    platform: '',
    username: '',
    email: '',
    account_type: 'social',
    importance: 'medium',
    closure_action: 'memorialize',
    notes: '',
  });

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const platform = (account.platform || '').toLowerCase();
      const email = (account.email || '').toLowerCase();
      const username = (account.username || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = !searchTerm || 
        platform.includes(searchLower) ||
        email.includes(searchLower) ||
        username.includes(searchLower);
      
      const matchesFilter = filterType === 'all' || account.account_type === filterType;
      
      return matchesSearch && matchesFilter;
    });
  }, [accounts, searchTerm, filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAccount) {
      await updateAccount(editingAccount.id, formData);
    } else {
      await createAccount(formData);
    }
    
    resetForm();
  };

  const handleEdit = (account: any) => {
    setFormData({
      platform: account.platform,
      username: account.username || '',
      email: account.email || '',
      account_type: account.account_type,
      importance: account.importance,
      closure_action: account.closure_action,
      notes: account.notes || '',
    });
    setEditingAccount(account);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      platform: '',
      username: '',
      email: '',
      account_type: 'social',
      importance: 'medium',
      closure_action: 'memorialize',
      notes: '',
    });
    setShowForm(false);
    setEditingAccount(null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-medium text-white mb-2">Digital Accounts</h1>
            <p className="text-white/70">
              Manage your digital accounts for your legacy plan
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-white text-primary hover:bg-white/90 rounded-full px-6 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Account
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search accounts..."
              className="bg-muted/50 border-none"
            />
          </div>
          <Select value={filterType} onValueChange={(value) => setFilterType(value as AccountType | 'all')}>
            <SelectTrigger className="w-full sm:w-48 bg-muted/50 border-none">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="cloud">Cloud Storage</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="glass rounded-3xl p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-card-foreground">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-card-foreground">Platform/Service *</Label>
                  <Input
                    value={formData.platform}
                    onChange={(e) => setFormData({...formData, platform: e.target.value})}
                    className="h-12 bg-muted/50 border-border rounded-xl"
                    placeholder="e.g., Gmail, Facebook"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-card-foreground">Account Type</Label>
                  <Select value={formData.account_type} onValueChange={(value) => setFormData({...formData, account_type: value as AccountType})}>
                    <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="cloud">Cloud Storage</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                <div className="space-y-2">
                  <Label className="text-card-foreground">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="h-12 bg-muted/50 border-border rounded-xl"
                    placeholder="account@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-card-foreground">Username</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="h-12 bg-muted/50 border-border rounded-xl"
                    placeholder="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-card-foreground">Importance</Label>
                  <Select value={formData.importance} onValueChange={(value) => setFormData({...formData, importance: value as ImportanceLevel})}>
                    <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-card-foreground">Closure Action</Label>
                  <Select value={formData.closure_action} onValueChange={(value) => setFormData({...formData, closure_action: value as ClosureAction})}>
                    <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="memorialize">Memorialize</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="download">Download</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-card-foreground">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="bg-muted/50 border-border rounded-xl"
                  rows={4}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90 rounded-full px-6"
                >
                  {editingAccount ? 'Update Account' : 'Add Account'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Accounts List */}
        <div className="space-y-4">
          {filteredAccounts.length === 0 ? (
            <Card className="bg-card border-border backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="p-4 rounded-2xl bg-muted w-fit mx-auto mb-6">
                    <CreditCard className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">No accounts found</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {searchTerm || filterType !== 'all' 
                      ? 'No accounts match your search criteria. Try adjusting your filters or search terms.' 
                      : 'Start adding your digital accounts to create a comprehensive digital legacy plan.'}
                  </p>
                  {(!searchTerm && filterType === 'all') && (
                    <Button 
                      onClick={() => setShowForm(true)}
                      className="bg-primary hover:bg-primary/90 shadow-lg font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Account
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredAccounts.map((account) => (
                <Card key={account.id} className="bg-card border-border backdrop-blur-sm hover:bg-card/80 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/20 transition-colors">
                            <CreditCard className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-foreground mb-1 truncate">{account.platform}</h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge 
                                variant="secondary" 
                                className="bg-primary/20 text-primary border-primary/30 text-xs font-medium"
                              >
                                {account.account_type}
                              </Badge>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs font-medium ${
                                  account.importance === 'critical' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                                  account.importance === 'high' ? 'bg-warning/20 text-warning border-warning/30' :
                                  account.importance === 'medium' ? 'bg-warning/10 text-warning/80 border-warning/20' :
                                  'bg-muted text-muted-foreground border-muted'
                                }`}
                              >
                                {account.importance}
                              </Badge>
                              <span className="text-muted-foreground text-sm">→ {account.closure_action}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {account.email && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground font-medium">Email:</span>
                              <span className="text-foreground">{account.email}</span>
                            </div>
                          )}
                          
                          {account.username && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground font-medium">Username:</span>
                              <span className="text-foreground">{account.username}</span>
                            </div>
                          )}
                        </div>

                        {account.notes && (
                          <p className="text-slate-300 mt-4 leading-relaxed">{account.notes}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 ml-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(account)}
                          className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 h-10 w-10 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAccount(account.id)}
                          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-10 w-10 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Accounts;