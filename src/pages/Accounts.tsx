import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { useAccounts } from '@/hooks/useAccounts';
import { usePlan, FREE_PLAN_LIMITS } from '@/hooks/usePlan';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Plus, Edit, Trash2, PoundSterling } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import SearchInput from '@/components/ui/search-input';
import UpgradePrompt from '@/components/UpgradePrompt';
import FinancialsTab from '@/components/financials/FinancialsTab';

type AccountType = 'social' | 'financial' | 'email' | 'cloud' | 'subscription' | 'other';
type ImportanceLevel = 'low' | 'medium' | 'high' | 'critical';
type ClosureAction = 'delete' | 'memorialize' | 'transfer' | 'download';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  social: 'Social',
  financial: 'Financial',
  email: 'Email',
  cloud: 'Cloud Storage',
  subscription: 'Subscription',
  other: 'Other',
};

interface AccountFormData {
  platform: string;
  username: string;
  email: string;
  account_type: AccountType;
  importance: ImportanceLevel;
  closure_action: ClosureAction;
  notes: string;
  credentials: string;
}

const Accounts = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts();
  const { plan } = usePlan();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const defaultTab = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [formData, setFormData] = useState<AccountFormData>({
    platform: '', username: '', email: '', account_type: 'social',
    importance: 'medium', closure_action: 'memorialize', notes: '', credentials: '',
  });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Compute dynamic category tabs from accounts
  const categoryTabs = useMemo(() => {
    const categories = new Set<string>();
    accounts.forEach(a => {
      if (a.account_type) categories.add(a.account_type);
    });
    return Array.from(categories).sort();
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const platform = (account.platform || '').toLowerCase();
      const email = (account.email || '').toLowerCase();
      const username = (account.username || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || platform.includes(searchLower) || email.includes(searchLower) || username.includes(searchLower);
      const matchesTab = activeTab === 'all' || account.account_type === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [accounts, searchTerm, activeTab]);

  // When searching on "All" tab, show all matching results regardless of tab
  const searchResults = useMemo(() => {
    if (!searchTerm || activeTab !== 'all') return filteredAccounts;
    return accounts.filter(account => {
      const platform = (account.platform || '').toLowerCase();
      const email = (account.email || '').toLowerCase();
      const username = (account.username || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      return platform.includes(searchLower) || email.includes(searchLower) || username.includes(searchLower);
    });
  }, [accounts, searchTerm, activeTab, filteredAccounts]);

  const displayAccounts = activeTab === 'all' && searchTerm ? searchResults : filteredAccounts;

  const isFreeBlocked = plan === 'free';

  if (!loading && isFreeBlocked) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="mb-4">
            <h1 className="text-3xl lg:text-4xl font-medium text-card-foreground mb-2">Accounts & Financials</h1>
            <p className="text-muted-foreground">Manage your digital accounts and financial legacy</p>
          </div>
          <UpgradePrompt message="Digital accounts are a paid feature. Upgrade to catalogue your accounts with closure instructions for your contacts." featureKey="accounts" />
        </div>
      </DashboardLayout>
    );
  }

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
      platform: account.platform, username: account.username || '', email: account.email || '',
      account_type: account.account_type, importance: account.importance,
      closure_action: account.closure_action, notes: account.notes || '', credentials: account.credentials || '',
    });
    setEditingAccount(account);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ platform: '', username: '', email: '', account_type: 'social', importance: 'medium', closure_action: 'memorialize', notes: '', credentials: '' });
    setShowForm(false);
    setEditingAccount(null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center animate-pulse">
            <CreditCard className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-4">
          <h1 className="text-3xl lg:text-4xl font-medium text-card-foreground mb-2">Accounts & Financials</h1>
          <p className="text-muted-foreground">Manage your digital accounts and financial legacy</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 rounded-xl p-1 mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4">
              All
            </TabsTrigger>
            {categoryTabs.map(cat => (
              <TabsTrigger key={cat} value={cat} className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4">
                {ACCOUNT_TYPE_LABELS[cat as AccountType] || cat}
              </TabsTrigger>
            ))}
            <TabsTrigger value="financials" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4">
              <PoundSterling className="w-4 h-4 mr-1" />Financials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financials">
            <FinancialsTab />
          </TabsContent>

          {/* All other tabs share the same account list view */}
          {['all', ...categoryTabs].map(tab => (
            <TabsContent key={tab} value={tab}>
              <div className="space-y-6">
                {!isFreeBlocked && (
                  <div className="flex justify-end">
                    <Button onClick={() => setShowForm(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shadow-lg shadow-primary/20">
                      <Plus className="w-5 h-5 mr-2" />Add Account
                    </Button>
                  </div>
                )}

                {isFreeBlocked && accounts.length === 0 && (
                  <UpgradePrompt message="Upgrade to store and share digital account information with your contacts." />
                )}

                {(!isFreeBlocked || accounts.length > 0) && (
                  <>
                    {tab === 'all' && (
                      <div className="bg-muted/30 rounded-2xl p-4">
                        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search all accounts..." className="bg-card/50 border-border" />
                      </div>
                    )}

                    {showForm && (
                      <div className="bg-muted/30 rounded-2xl p-6">
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
                              <Input value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})} className="h-12 bg-muted/50 border-border rounded-xl" placeholder="e.g., Gmail, Facebook" required />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-card-foreground">Account Type</Label>
                              <Select value={formData.account_type} onValueChange={(value) => setFormData({...formData, account_type: value as AccountType})}>
                                <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-card-foreground">Email</Label>
                              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 bg-muted/50 border-border rounded-xl" placeholder="account@example.com" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-card-foreground">Username</Label>
                              <Input value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="h-12 bg-muted/50 border-border rounded-xl" placeholder="username" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-card-foreground">Importance</Label>
                              <Select value={formData.importance} onValueChange={(value) => setFormData({...formData, importance: value as ImportanceLevel})}>
                                <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl"><SelectValue /></SelectTrigger>
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
                                <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl"><SelectValue /></SelectTrigger>
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
                            <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="bg-muted/50 border-border rounded-xl" rows={4} placeholder="Additional notes..." />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-card-foreground">Credentials / Password Hint</Label>
                            <Textarea value={formData.credentials} onChange={(e) => setFormData({...formData, credentials: e.target.value})} className="bg-muted/50 border-border rounded-xl" rows={3} placeholder="Password hints, recovery codes... (encrypted)" />
                            <p className="text-xs text-muted-foreground">End-to-end encrypted. Only visible to authorized contacts.</p>
                          </div>
                          <div className="flex gap-3 pt-4">
                            <Button type="submit" className="bg-primary hover:bg-primary/90 rounded-full px-6">{editingAccount ? 'Update Account' : 'Add Account'}</Button>
                            <Button type="button" variant="outline" onClick={resetForm} className="rounded-full">Cancel</Button>
                          </div>
                        </form>
                      </div>
                    )}

                    <div className="space-y-4">
                      {displayAccounts.length === 0 ? (
                        <Card className="bg-card border-border backdrop-blur-sm">
                          <CardContent className="p-12 text-center">
                            <div className="max-w-md mx-auto">
                              <div className="p-4 rounded-2xl bg-muted w-fit mx-auto mb-6"><CreditCard className="w-12 h-12 text-muted-foreground" /></div>
                              <h3 className="text-xl font-semibold text-foreground mb-3">No accounts found</h3>
                              <p className="text-muted-foreground mb-6 leading-relaxed">
                                {searchTerm ? 'No accounts match your search criteria.' : 'Start adding your digital accounts to create a comprehensive digital legacy plan.'}
                              </p>
                              {(!searchTerm && !isFreeBlocked) && (
                                <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 shadow-lg font-semibold"><Plus className="w-4 h-4 mr-2" />Add Your First Account</Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid gap-6">
                          {displayAccounts.map((account) => (
                            <Card key={account.id} className="bg-card border-border backdrop-blur-sm hover:bg-card/80 transition-all duration-300 group">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-4 mb-4">
                                      <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/20 transition-colors"><CreditCard className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" /></div>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-foreground mb-1 truncate">{account.platform}</h3>
                                        <div className="flex items-center gap-3 flex-wrap">
                                          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs font-medium">
                                            {ACCOUNT_TYPE_LABELS[account.account_type as AccountType] || account.account_type}
                                          </Badge>
                                          <Badge variant="secondary" className={`text-xs font-medium ${account.importance === 'critical' ? 'bg-destructive/20 text-destructive border-destructive/30' : account.importance === 'high' ? 'bg-warning/20 text-warning border-warning/30' : account.importance === 'medium' ? 'bg-warning/10 text-warning/80 border-warning/20' : 'bg-muted text-muted-foreground border-muted'}`}>{account.importance}</Badge>
                                          <span className="text-muted-foreground text-sm">→ {account.closure_action}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      {account.email && (<div className="flex items-center gap-2"><span className="text-muted-foreground font-medium">Email:</span><span className="text-foreground">{account.email}</span></div>)}
                                      {account.username && (<div className="flex items-center gap-2"><span className="text-muted-foreground font-medium">Username:</span><span className="text-foreground">{account.username}</span></div>)}
                                    </div>
                                    {account.notes && (<p className="text-muted-foreground mt-4 leading-relaxed">{account.notes}</p>)}
                                  </div>
                                  <div className="flex items-center gap-1 ml-6">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(account)} className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 p-0"><Edit className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(account.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 p-0"><Trash2 className="w-4 h-4" /></Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <ConfirmationDialog
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          title="Delete Account"
          description="Are you sure you want to delete this account? This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
          onConfirm={() => { if (deleteTarget) deleteAccount(deleteTarget); setDeleteTarget(null); }}
        />
      </div>
    </DashboardLayout>
  );
};

export default Accounts;
