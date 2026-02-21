import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import SearchInput from '@/components/ui/search-input';
import { Shield, Users, CreditCard, Timer, MoreVertical, Plus, UserPlus, AlertTriangle, CalendarIcon } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { formatDateEUShort } from '@/utils/dateUtils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  plan: string;
  plan_expires_at: string | null;
  deactivated: boolean;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  free_users: number;
  paid_users: number;
  active_switches: number;
  checked_in_today: number;
}

const Admin = () => {
  const { user } = useAuth();
  const { isAdmin, loading: planLoading } = usePlan();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', plan: 'free' });
  
  // Expiry date editor state
  const [showExpiryEditor, setShowExpiryEditor] = useState(false);
  const [expiryTarget, setExpiryTarget] = useState<UserProfile | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [expiryDateInput, setExpiryDateInput] = useState('');
  const [expiryDateError, setExpiryDateError] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const [profilesResult, statsResult] = await Promise.all([
        supabase.rpc('admin_list_profiles'),
        supabase.rpc('admin_get_stats'),
      ]);

      if (profilesResult.data) {
        setUsers(profilesResult.data as unknown as UserProfile[]);
      }
      if (statsResult.data) {
        setStats(statsResult.data as unknown as AdminStats);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({ title: 'Error', description: 'Failed to load admin data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPlan = async (userProfile: UserProfile, newPlan: string) => {
    try {
      const updates: any = { plan: newPlan };
      if (newPlan === 'paid') {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        updates.plan_expires_at = expiresAt.toISOString();
      } else {
        updates.plan_expires_at = null;
      }
      await supabase.rpc('admin_update_profile', {
        _profile_user_id: userProfile.user_id,
        _updates: updates,
      });
      toast({ title: 'Success', description: `Plan set to ${newPlan}` });
      fetchData();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({ title: 'Error', description: 'Failed to update plan', variant: 'destructive' });
    }
  };

  const handleExtendPlan = async (userProfile: UserProfile) => {
    try {
      const currentExpiry = userProfile.plan_expires_at ? new Date(userProfile.plan_expires_at) : new Date();
      currentExpiry.setFullYear(currentExpiry.getFullYear() + 1);
      await supabase.rpc('admin_update_profile', {
        _profile_user_id: userProfile.user_id,
        _updates: { plan_expires_at: currentExpiry.toISOString() },
      });
      toast({ title: 'Success', description: 'Plan extended by 1 year' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to extend plan', variant: 'destructive' });
    }
  };

  const handleToggleDeactivation = async (userProfile: UserProfile) => {
    try {
      await supabase.rpc('admin_update_profile', {
        _profile_user_id: userProfile.user_id,
        _updates: { deactivated: String(!userProfile.deactivated) },
      });
      toast({ title: 'Success', description: userProfile.deactivated ? 'Account reactivated' : 'Account deactivated' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update account', variant: 'destructive' });
    }
  };

  const handleOpenExpiryEditor = (userProfile: UserProfile) => {
    setExpiryTarget(userProfile);
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() + 1);
    const date = userProfile.plan_expires_at ? new Date(userProfile.plan_expires_at) : defaultDate;
    setExpiryDate(date);
    setExpiryDateInput(formatDateEUShort(date.toISOString()));
    setExpiryDateError('');
    setShowCalendar(false);
    setShowExpiryEditor(true);
  };

  const parseEUDate = (input: string): Date | null => {
    const match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (date.getDate() !== parseInt(day) || date.getMonth() !== parseInt(month) - 1 || date.getFullYear() !== parseInt(year)) return null;
    return date;
  };

  const handleExpiryDateInputChange = (value: string) => {
    setExpiryDateInput(value);
    setExpiryDateError('');
    const parsed = parseEUDate(value);
    if (parsed) {
      if (parsed <= new Date()) {
        setExpiryDateError('Date must be in the future');
      } else {
        setExpiryDate(parsed);
        setExpiryDateError('');
      }
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setExpiryDate(date);
      setExpiryDateInput(formatDateEUShort(date.toISOString()));
      setExpiryDateError('');
      setShowCalendar(false);
    }
  };

  const handleSaveExpiry = async () => {
    if (!expiryTarget) return;
    // Validate from input field
    const parsed = parseEUDate(expiryDateInput);
    if (!parsed) {
      setExpiryDateError('Enter a valid date in DD/MM/YYYY format');
      return;
    }
    if (parsed <= new Date()) {
      setExpiryDateError('Date must be in the future');
      return;
    }
    try {
      await supabase.rpc('admin_update_profile', {
        _profile_user_id: expiryTarget.user_id,
        _updates: { plan_expires_at: parsed.toISOString() },
      });
      toast({ title: 'Success', description: `Expiry date updated to ${formatDateEUShort(parsed.toISOString())}` });
      setShowExpiryEditor(false);
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update expiry date', variant: 'destructive' });
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) return;
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { email: newUser.email, password: newUser.password, plan: newUser.plan },
      });
      if (error) throw error;
      toast({ title: 'User created', description: `Account created for ${newUser.email}` });
      setShowCreateDialog(false);
      setNewUser({ email: '', password: '', plan: 'free' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create user', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  if (planLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredUsers = users.filter(u => {
    const search = searchQuery.toLowerCase();
    return !search ||
      u.user_id.toLowerCase().includes(search);
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-medium text-card-foreground mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Manage users and plans</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90 rounded-full px-6">
            <UserPlus className="w-4 h-4 mr-2" />Create User
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Users', value: stats.total_users, icon: Users },
              { label: 'Free Users', value: stats.free_users, icon: Users },
              { label: 'Paid Users', value: stats.paid_users, icon: CreditCard },
              { label: 'Active Switches', value: stats.active_switches, icon: Timer },
              { label: 'Checked In Today', value: stats.checked_in_today, icon: Shield },
            ].map((stat) => (
              <Card key={stat.label} className="bg-muted/30 border-none rounded-2xl">
                <CardContent className="p-4 text-center">
                  <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-semibold text-card-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="bg-muted/30 rounded-2xl p-4">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search users..." className="bg-card/50 border-border" />
        </div>

        {/* Users Table */}
        <div className="bg-muted/30 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Plan</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Member Since</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.user_id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="text-sm font-medium text-card-foreground">
                        {u.user_id.slice(0, 8)}...
                      </div>
                      <div className="text-xs text-muted-foreground">User ID</div>
                    </td>
                    <td className="p-4">
                      {(() => {
                        const isExpired = u.plan === 'paid' && u.plan_expires_at && new Date(u.plan_expires_at) <= new Date();
                        return (
                          <>
                            <Badge className={
                              isExpired ? 'bg-destructive/20 text-destructive border-destructive/30' :
                              u.plan === 'paid' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted text-muted-foreground'
                            }>
                              {isExpired ? 'Expired' : u.plan === 'paid' ? 'Paid' : 'Free'}
                            </Badge>
                            {u.plan === 'paid' && u.plan_expires_at && (
                              <p className={cn("text-xs mt-1", isExpired ? 'text-destructive' : 'text-muted-foreground')}>
                                {isExpired ? 'Expired' : 'Expires'} {formatDateEUShort(u.plan_expires_at)}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="p-4">
                      <Badge className={u.deactivated ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}>
                        {u.deactivated ? 'Deactivated' : 'Active'}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDateEUShort(u.created_at)}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border rounded-xl">
                          <DropdownMenuItem onClick={() => handleSetPlan(u, 'free')}>Set to Free</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetPlan(u, 'paid')}>Set to Paid</DropdownMenuItem>
                          {u.plan === 'paid' && (
                            <DropdownMenuItem onClick={() => handleExtendPlan(u)}>Extend +1 year</DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleOpenExpiryEditor(u)}>Edit expiry date</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleDeactivation(u)}>
                            {u.deactivated ? 'Reactivate' : 'Deactivate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => { setDeleteTarget(u); setShowDeleteDialog(true); }}
                          >
                            Delete account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="bg-card border-border rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-card-foreground">Email</Label>
                <Input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@example.com" />
              </div>
              <div>
                <Label className="text-card-foreground">Temporary Password</Label>
                <Input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Min 6 characters" />
              </div>
              <div>
                <Label className="text-card-foreground">Plan</Label>
                <Select value={newUser.plan} onValueChange={v => setNewUser({ ...newUser, plan: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateUser} disabled={creating}>
                {creating ? <LoadingSpinner size="sm" className="mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Expiry Date Dialog */}
        <Dialog open={showExpiryEditor} onOpenChange={(open) => { setShowExpiryEditor(open); if (!open) setShowCalendar(false); }}>
          <DialogContent className="bg-card border-border rounded-2xl" onPointerDownOutside={() => { setShowExpiryEditor(false); setShowCalendar(false); }}>
            <DialogHeader>
              <DialogTitle className="text-card-foreground">Edit Plan Expiry Date</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set expiry date for user {expiryTarget?.user_id.slice(0, 8)}...
              </p>
              <div>
                <Label className="text-card-foreground">Expiry Date (DD/MM/YYYY)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={expiryDateInput}
                    onChange={e => handleExpiryDateInputChange(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </div>
                {expiryDateError && (
                  <p className="text-sm text-destructive mt-1">{expiryDateError}</p>
                )}
              </div>
              {showCalendar && (
                <div className="flex justify-center pointer-events-auto">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={handleCalendarSelect}
                    initialFocus
                    className={cn("p-3 pointer-events-auto rounded-lg border border-border")}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowExpiryEditor(false); setShowCalendar(false); }}>Cancel</Button>
              <Button onClick={handleSaveExpiry}>Save Expiry Date</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-card border-border rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />Delete User Account
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will permanently delete all data for this user. Type their user ID to confirm:
            </p>
            <p className="text-xs font-mono text-card-foreground bg-muted/50 p-2 rounded">{deleteTarget?.user_id}</p>
            <Input
              value={deleteConfirmEmail}
              onChange={e => setDeleteConfirmEmail(e.target.value)}
              placeholder="Type user ID to confirm"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteConfirmEmail(''); }}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={deleteConfirmEmail !== deleteTarget?.user_id}
                onClick={async () => {
                  if (!deleteTarget) return;
                  try {
                    await supabase.functions.invoke('admin-delete-user', {
                      body: { userId: deleteTarget.user_id },
                    });
                    toast({ title: 'User deleted' });
                    setShowDeleteDialog(false);
                    setDeleteConfirmEmail('');
                    fetchData();
                  } catch (error: any) {
                    toast({ title: 'Error', description: error.message, variant: 'destructive' });
                  }
                }}
              >
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
