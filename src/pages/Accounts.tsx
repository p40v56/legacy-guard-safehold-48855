import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { usePlan } from '@/hooks/usePlan';
import { useEncryption } from '@/contexts/EncryptionContext';
import { decryptFields } from '@/lib/crypto';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Plus, Edit, Trash2, FileText, Mail, Users, Landmark, Briefcase, Play, Globe, AlertTriangle, Lock } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import SearchInput from '@/components/ui/search-input';
import UpgradePrompt from '@/components/UpgradePrompt';
import { Link } from 'react-router-dom';

type AccountType = 'social' | 'financial' | 'email' | 'cloud' | 'subscription' | 'device' | 'other';
type ImportanceLevel = 'low' | 'medium' | 'high' | 'critical';
type ClosureAction = 'delete' | 'memorialize' | 'transfer' | 'download';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  social: 'Social',
  financial: 'Financial',
  email: 'Email',
  cloud: 'Cloud Storage',
  subscription: 'Subscription',
  device: 'Device & Physical',
  other: 'Other',
};

const ACCOUNT_TYPE_CONFIG: Record<string, { icon: React.ReactNode; bg: string; iconColor: string }> = {
  email: { icon: <Mail className="w-5 h-5" />, bg: 'bg-blue-500/15', iconColor: 'text-blue-500' },
  social: { icon: <Users className="w-5 h-5" />, bg: 'bg-purple-500/15', iconColor: 'text-purple-500' },
  financial: { icon: <Landmark className="w-5 h-5" />, bg: 'bg-emerald-500/15', iconColor: 'text-emerald-500' },
  work: { icon: <Briefcase className="w-5 h-5" />, bg: 'bg-amber-500/15', iconColor: 'text-amber-500' },
  device: { icon: <Lock className="w-5 h-5" />, bg: 'bg-slate-500/15', iconColor: 'text-slate-500' },
  entertainment: { icon: <Play className="w-5 h-5" />, bg: 'bg-pink-500/15', iconColor: 'text-pink-500' },
  cloud: { icon: <Globe className="w-5 h-5" />, bg: 'bg-cyan-500/15', iconColor: 'text-cyan-500' },
  subscription: { icon: <Monitor className="w-5 h-5" />, bg: 'bg-orange-500/15', iconColor: 'text-orange-500' },
  other: { icon: <Globe className="w-5 h-5" />, bg: 'bg-gray-500/15', iconColor: 'text-gray-500' },
};

const CLOSURE_STYLES: Record<string, string> = {
  delete: 'bg-red-500/10 text-red-600 border border-red-200',
  memorialize: 'bg-purple-500/10 text-purple-600 border border-purple-200',
  transfer: 'bg-blue-500/10 text-blue-600 border border-blue-200',
  download: 'bg-amber-500/10 text-amber-600 border border-amber-200',
};

const CLOSURE_LABELS: Record<string, string> = {
  delete: '→ Delete',
  memorialize: '→ Memorialize',
  transfer: '→ Transfer',
  download: '→ Download data',
};

const IMPORTANCE_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

interface AccountFormData {
  platform: string;
  username: string;
  email: string;
  account_type: AccountType;
  importance: ImportanceLevel;
  closure_action: ClosureAction;
  notes: string;
  credentials: string;
  attached_document_ids: string[];
}

const Accounts = () => {
  const { user } = useAuth();
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts();
  const { plan, limits, isFree } = usePlan();
  const { vaultKey } = useEncryption();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState<AccountFormData>({
    platform: '', username: '', email: '', account_type: 'social',
    importance: 'medium', closure_action: 'memorialize', notes: '', credentials: '',
    attached_document_ids: [],
  });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [availableDocs, setAvailableDocs] = useState<{id: string; title: string; document_type: string}[]>([]);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    const fetchDocs = async () => {
      const { data } = await supabase
        .from('legacy_documents')
        .select('id, title, title_iv, document_type')
        .eq('user_id', user.id);
      if (!data) return;
      const docs = await Promise.all(data.map(async (doc) => {
        let title = doc.title;
        if (vaultKey && doc.title_iv) {
          try {
            const decrypted = await decryptFields(doc, ['title'], vaultKey);
            title = decrypted.title || doc.title;
          } catch { /* use raw */ }
        }
        return { id: doc.id, title, document_type: doc.document_type };
      }));
      setAvailableDocs(docs);
    };
    fetchDocs();
  }, [user, vaultKey]);

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

  const sortedAccounts = useMemo(() => {
    return [...displayAccounts].sort((a, b) =>
      (IMPORTANCE_ORDER[a.importance] ?? 4) - (IMPORTANCE_ORDER[b.importance] ?? 4)
    );
  }, [displayAccounts]);

  const isFreeBlocked = limits.maxAccounts === 0;
  const isAtAccountLimit = limits.maxAccounts !== Infinity && limits.maxAccounts > 0 && accounts.length >= limits.maxAccounts;

  if (!loading && isFreeBlocked) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="mb-4">
            <h1 className="text-3xl lg:text-4xl font-medium text-card-foreground mb-2">Digital Accounts</h1>
            <p className="text-muted-foreground">Manage your online presence and digital accounts</p>
          </div>
          <UpgradePrompt message="Digital accounts require the Essential plan or higher. Upgrade to catalogue your accounts with closure instructions for your contacts." featureKey="accounts" />
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      attached_document_ids: formData.attached_document_ids.length > 0 ? formData.attached_document_ids : undefined,
    };
    if (editingAccount) {
      await updateAccount(editingAccount.id, submitData as any);
    } else {
      await createAccount(submitData as any);
    }
    resetForm();
  };

  const handleEdit = (account: any) => {
    setFormData({
      platform: account.platform, username: account.username || '', email: account.email || '',
      account_type: account.account_type, importance: account.importance,
      closure_action: account.closure_action, notes: account.notes || '', credentials: account.credentials || '',
      attached_document_ids: account.attached_document_ids || [],
    });
    setEditingAccount(account);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ platform: '', username: '', email: '', account_type: 'social', importance: 'medium', closure_action: 'memorialize', notes: '', credentials: '', attached_document_ids: [] });
    setShowForm(false);
    setEditingAccount(null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center animate-pulse">
            <Monitor className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const toggleCredentials = (accountId: string) => {
    setShowCredentials(prev => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-4">
          <h1 className="text-3xl lg:text-4xl font-medium text-card-foreground mb-2">Digital Accounts</h1>
          <p className="text-muted-foreground">Manage your online presence and digital accounts</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <div className="flex overflow-x-auto gap-1 no-scrollbar flex-shrink-0">
              <TabsList className="bg-muted/50 rounded-xl p-1 flex-wrap h-auto gap-1">
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4">
                  All
                </TabsTrigger>
                {categoryTabs.map(cat => (
                  <TabsTrigger key={cat} value={cat} className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4">
                    {ACCOUNT_TYPE_LABELS[cat as AccountType] || cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="flex-1">
              <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search accounts..." className="bg-card/50 border-border" />
            </div>
            {!isFreeBlocked && !isAtAccountLimit && (
              <div className="flex-shrink-0">
                <Button onClick={() => setShowForm(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shadow-lg shadow-primary/20">
                  <Plus className="w-5 h-5 mr-2" />Add Account
                </Button>
              </div>
            )}
          </div>

          {['all', ...categoryTabs].map(tab => (
            <TabsContent key={tab} value={tab}>
              <div className="space-y-6">
                  {isAtAccountLimit && (
                    <UpgradePrompt
                      message={`Your plan allows up to ${limits.maxAccounts} accounts. Upgrade to add more.`}
                      featureKey="accounts"
                      requiredPlan={plan === 'essential' ? 'family' : 'essential'}
                    />
                  )}

                  {isFreeBlocked && accounts.length === 0 && (
                    <UpgradePrompt message="Upgrade to store and share digital account information with your contacts." featureKey="accounts" />
                  )}

                {(!isFreeBlocked || accounts.length > 0) && (
                  <>
                    {showForm && (
                      <div className="bg-muted/30 rounded-2xl p-6">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Monitor className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="text-xl font-medium text-card-foreground">
                            {editingAccount ? 'Edit Account' : 'Add New Account'}
                          </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-card-foreground">{formData.account_type === 'device' ? 'Device / Item Name *' : 'Platform/Service *'}</Label>
                              <Input value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})} className="h-12 bg-muted/50 border-border rounded-xl" placeholder={formData.account_type === 'device' ? 'e.g. iPhone, MacBook, Home Safe, Alarm System' : 'e.g., Gmail, Facebook'} required />
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

                          {/* Linked Documents */}
                          <div className="space-y-3">
                            <Label className="text-card-foreground font-medium">Linked Documents</Label>
                            <p className="text-xs text-muted-foreground">Attach relevant documents to this account</p>
                            {availableDocs.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {availableDocs.map(doc => (
                                  <div key={doc.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`inline-doc-${doc.id}`}
                                      checked={formData.attached_document_ids.includes(doc.id)}
                                      onCheckedChange={(checked) => {
                                        setFormData(prev => ({
                                          ...prev,
                                          attached_document_ids: checked
                                            ? [...prev.attached_document_ids, doc.id]
                                            : prev.attached_document_ids.filter(id => id !== doc.id)
                                        }));
                                      }}
                                    />
                                    <label htmlFor={`inline-doc-${doc.id}`} className="text-sm text-card-foreground cursor-pointer flex items-center gap-2">
                                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                      {doc.title}
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{doc.document_type}</Badge>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No documents yet. Upload documents in the Documents section first.</p>
                            )}
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button type="submit" className="bg-primary hover:bg-primary/90 rounded-full px-6">{editingAccount ? 'Update Account' : 'Add Account'}</Button>
                            <Button type="button" variant="outline" onClick={resetForm} className="rounded-full">Cancel</Button>
                          </div>
                        </form>
                      </div>
                    )}

                    <div className="space-y-4">
                      {sortedAccounts.length === 0 ? (
                        accounts.length === 0 && !searchTerm ? (
                          <div className="text-center py-16 space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                              <Monitor className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium text-card-foreground">No digital accounts yet</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                              Add your email, social media, banking and other online accounts so your contacts know what exists and what to do with each one.
                            </p>
                            <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 rounded-xl">
                              <Plus className="w-4 h-4 mr-2" />Add your first account
                            </Button>
                          </div>
                        ) : (
                          <Card className="bg-card border-border backdrop-blur-sm">
                            <CardContent className="p-12 text-center">
                              <div className="max-w-md mx-auto">
                                <div className="p-4 rounded-2xl bg-muted w-fit mx-auto mb-6"><Monitor className="w-12 h-12 text-muted-foreground" /></div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">No accounts found</h3>
                                <p className="text-muted-foreground mb-6 leading-relaxed">No accounts match your search criteria.</p>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      ) : (
                        <div className="grid gap-4">
                          {sortedAccounts.map((account) => {
                            const typeConfig = ACCOUNT_TYPE_CONFIG[account.account_type] || ACCOUNT_TYPE_CONFIG.other;
                            const isCredsVisible = showCredentials[account.id] || false;

                            return (
                              <Card key={account.id} className="bg-card border-border backdrop-blur-sm hover:bg-card/80 transition-all duration-300 group">
                                <CardContent className="p-5">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex gap-3 flex-1 min-w-0">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConfig.bg}`}>
                                        <span className={typeConfig.iconColor}>{typeConfig.icon}</span>
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                          <h3 className="text-base font-semibold text-foreground truncate">{account.platform}</h3>
                                          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs font-medium">
                                            {ACCOUNT_TYPE_LABELS[account.account_type as AccountType] || account.account_type}
                                          </Badge>
                                          <Badge variant="secondary" className={`text-xs font-medium ${account.importance === 'critical' ? 'bg-destructive/20 text-destructive border-destructive/30' : account.importance === 'high' ? 'bg-warning/20 text-warning border-warning/30' : account.importance === 'medium' ? 'bg-warning/10 text-warning/80 border-warning/20' : 'bg-muted text-muted-foreground border-muted'}`}>
                                            {account.importance}
                                          </Badge>
                                          {account.closure_action && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CLOSURE_STYLES[account.closure_action] || 'bg-muted text-muted-foreground'}`}>
                                              {CLOSURE_LABELS[account.closure_action] || account.closure_action}
                                            </span>
                                          )}
                                        </div>

                                        <div className="mt-3 space-y-1.5">
                                          {account.email && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <span className="text-muted-foreground w-20 shrink-0">Email</span>
                                              <a href={`mailto:${account.email}`} className="text-foreground hover:text-primary transition-colors truncate">{account.email}</a>
                                            </div>
                                          )}
                                          {account.username && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <span className="text-muted-foreground w-20 shrink-0">Username</span>
                                              <span className="text-foreground font-mono">{account.username}</span>
                                            </div>
                                          )}
                                          {(account as any).website_url && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <span className="text-muted-foreground w-20 shrink-0">Website</span>
                                              <a href={(account as any).website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{(account as any).website_url}</a>
                                            </div>
                                          )}
                                          {account.credentials && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <span className="text-muted-foreground w-20 shrink-0">Password</span>
                                              {isCredsVisible ? (
                                                <span className="text-foreground font-mono text-xs">{account.credentials}</span>
                                              ) : (
                                                <span className="text-foreground font-mono">{'•'.repeat(8)}</span>
                                              )}
                                              <button
                                                onClick={() => toggleCredentials(account.id)}
                                                className="text-xs text-primary hover:underline ml-1"
                                              >
                                                {isCredsVisible ? 'Hide' : 'Reveal'}
                                              </button>
                                            </div>
                                          )}
                                          {account.notes && (
                                            <div className="flex items-start gap-2 text-sm mt-2">
                                              <span className="text-muted-foreground w-20 shrink-0 pt-0.5">📝 Note</span>
                                              <span className="text-muted-foreground leading-relaxed">{account.notes}</span>
                                            </div>
                                          )}
                                        </div>

                                        {!account.credentials && !account.notes && (
                                          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            No password or notes added — your contact may not have enough information to act.
                                          </p>
                                        )}

                                        {account.attached_document_ids && account.attached_document_ids.length > 0 && (
                                          <LinkedDocsPills documentIds={account.attached_document_ids} vaultKey={vaultKey} />
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <button
                                        onClick={() => handleEdit(account)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-sm"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Edit</span>
                                      </button>
                                      <button
                                        onClick={() => setDeleteTarget(account.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-sm"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Delete</span>
                                      </button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
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

// Sub-component for linked document pills
const LinkedDocsPills = ({ documentIds, vaultKey }: { documentIds: string[]; vaultKey: CryptoKey | null }) => {
  const [linkedDocs, setLinkedDocs] = useState<{id: string; title: string}[]>([]);

  useEffect(() => {
    if (!documentIds || documentIds.length === 0) return;
    const fetchDocs = async () => {
      const { data } = await supabase
        .from('legacy_documents')
        .select('id, title, title_iv')
        .in('id', documentIds);
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
  }, [documentIds, vaultKey]);

  if (linkedDocs.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mt-3 flex-wrap">
      <span className="text-xs text-muted-foreground">📎 Linked:</span>
      {linkedDocs.map(doc => (
        <Link key={doc.id} to="/documents" className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors">
          <FileText className="w-3 h-3" />
          {doc.title}
        </Link>
      ))}
    </div>
  );
};

export default Accounts;
