import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Mail, Phone, User, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SearchInput from '@/components/ui/search-input';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
  contact_type: 'primary' | 'secondary' | 'professional' | 'legal';
  priority_order: number;
  can_access_accounts: boolean;
  can_receive_messages: boolean;
}

const Contacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'primary' | 'secondary' | 'professional' | 'legal' | 'all'>('all');
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    relationship: string;
    contact_type: 'primary' | 'secondary' | 'professional' | 'legal';
    priority_order: number;
    can_access_accounts: boolean;
    can_receive_messages: boolean;
  }>({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    contact_type: 'primary',
    priority_order: 1,
    can_access_accounts: false,
    can_receive_messages: true,
  });

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('priority_order');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingContact) {
        const { error } = await supabase
          .from('emergency_contacts')
          .update(formData)
          .eq('id', editingContact.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Contact updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('emergency_contacts')
          .insert([{ ...formData, user_id: user?.id }]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Contact added successfully",
        });
      }

      setShowAddDialog(false);
      setEditingContact(null);
      resetForm();
      fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      relationship: '',
      contact_type: 'primary',
      priority_order: 1,
      can_access_accounts: false,
      can_receive_messages: true,
    });
  };

  const openAddDialog = () => {
    resetForm();
    setEditingContact(null);
    setShowAddDialog(true);
  };

  const openEditDialog = (contact: Contact) => {
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      relationship: contact.relationship || '',
      contact_type: contact.contact_type,
      priority_order: contact.priority_order,
      can_access_accounts: contact.can_access_accounts,
      can_receive_messages: contact.can_receive_messages,
    });
    setEditingContact(contact);
    setShowAddDialog(true);
  };

  const getContactTypeColor = (type: string) => {
    switch (type) {
      case 'primary': return 'bg-emerald-600/20 text-emerald-400';
      case 'secondary': return 'bg-blue-600/20 text-blue-400';
      case 'professional': return 'bg-purple-600/20 text-purple-400';
      case 'legal': return 'bg-orange-600/20 text-orange-400';
      default: return 'bg-slate-600/20 text-slate-400';
    }
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.phone && contact.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.relationship && contact.relationship.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterType === 'all' || contact.contact_type === filterType;
      
      return matchesSearch && matchesFilter;
    });
  }, [contacts, searchTerm, filterType]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <div className="w-8 h-8 bg-emerald-600/20 rounded-lg animate-pulse mx-auto mb-4" />
          <p className="text-slate-400">Loading contacts...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Emergency Contacts</h1>
            <p className="text-slate-400">Manage your trusted contacts who will be notified in case of emergency</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-500">
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-slate-300">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
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
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-slate-300">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="relationship" className="text-slate-300">Relationship</Label>
                    <Input
                      id="relationship"
                      value={formData.relationship}
                      onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_type" className="text-slate-300">Contact Type</Label>
                    <Select value={formData.contact_type} onValueChange={(value: any) => setFormData({...formData, contact_type: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority_order" className="text-slate-300">Priority Order</Label>
                    <Input
                      id="priority_order"
                      type="number"
                      min="1"
                      value={formData.priority_order}
                      onChange={(e) => setFormData({...formData, priority_order: parseInt(e.target.value)})}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="can_access_accounts" className="text-slate-300">Can access digital accounts</Label>
                    <Switch
                      id="can_access_accounts"
                      checked={formData.can_access_accounts}
                      onCheckedChange={(checked) => setFormData({...formData, can_access_accounts: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="can_receive_messages" className="text-slate-300">Can receive legacy messages</Label>
                    <Switch
                      id="can_receive_messages"
                      checked={formData.can_receive_messages}
                      onCheckedChange={(checked) => setFormData({...formData, can_receive_messages: checked})}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 flex-1">
                    {editingContact ? 'Update Contact' : 'Add Contact'}
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
              placeholder="Search contacts by name, email, phone..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={filterType} onValueChange={(value: 'primary' | 'secondary' | 'professional' | 'legal' | 'all') => setFilterType(value)}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredContacts.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="text-center py-8">
                <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchTerm || filterType !== 'all' ? 'No Matching Contacts' : 'No contacts added yet'}
                </h3>
                <p className="text-slate-400 mb-4">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Add your first emergency contact to get started'
                  }
                </p>
                {!searchTerm && filterType === 'all' && (
                  <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredContacts.map((contact) => (
              <Card key={contact.id} className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{contact.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getContactTypeColor(contact.contact_type)}>
                          {contact.contact_type}
                        </Badge>
                        <span className="text-sm text-slate-400">Priority {contact.priority_order}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(contact)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-4 h-4" />
                      <span>{contact.email}</span>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-4 h-4" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    {contact.relationship && (
                      <div className="text-slate-400">
                        <span className="font-medium">Relationship:</span> {contact.relationship}
                      </div>
                    )}
                    <div className="flex gap-4 text-sm">
                      <span className={`${contact.can_access_accounts ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {contact.can_access_accounts ? '✓' : '✗'} Account Access
                      </span>
                      <span className={`${contact.can_receive_messages ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {contact.can_receive_messages ? '✓' : '✗'} Legacy Messages
                      </span>
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

export default Contacts;
