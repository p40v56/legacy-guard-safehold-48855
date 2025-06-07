
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Plus } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import SearchInput from '@/components/ui/search-input';
import AccountForm from '@/components/accounts/AccountForm';
import AccountCard from '@/components/accounts/AccountCard';

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
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAccount) {
      await updateAccount(editingAccount.id, formData);
    } else {
      await createAccount(formData);
    }
    
    resetForm();
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
          <AccountForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isEditing={!!editingAccount}
          />
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
              <AccountCard
                key={account.id}
                account={account}
                onEdit={handleEdit}
                onDelete={deleteAccount}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Accounts;
