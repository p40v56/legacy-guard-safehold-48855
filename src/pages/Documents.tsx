
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Edit, Trash2, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Document {
  id: string;
  title: string;
  description?: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  is_public: boolean;
  created_at: string;
}

const Documents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false,
  });

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('legacy_documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDocument) {
        const { error } = await supabase
          .from('legacy_documents')
          .update(formData)
          .eq('id', editingDocument.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Document updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('legacy_documents')
          .insert([{ ...formData, user_id: user?.id }]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Document added successfully",
        });
      }

      setShowAddDialog(false);
      setEditingDocument(null);
      resetForm();
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('legacy_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      is_public: false,
    });
  };

  const openAddDialog = () => {
    resetForm();
    setEditingDocument(null);
    setShowAddDialog(true);
  };

  const openEditDialog = (document: Document) => {
    setFormData({
      title: document.title,
      description: document.description || '',
      is_public: document.is_public,
    });
    setEditingDocument(document);
    setShowAddDialog(true);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <div className="w-8 h-8 bg-emerald-600/20 rounded-lg animate-pulse mx-auto mb-4" />
          <p className="text-slate-400">Loading documents...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Legacy Documents</h1>
            <p className="text-slate-400">Store important documents that will be shared with your contacts</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-500">
                <Plus className="w-4 h-4 mr-2" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingDocument ? 'Edit Document' : 'Add Legacy Document'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-slate-300">Document Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="e.g., Will and Testament, Insurance Policies, etc."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-slate-300">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                    placeholder="Brief description of the document and its importance..."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_public" className="text-slate-300">Make document publicly accessible</Label>
                    <p className="text-sm text-slate-500">Allow contacts to access this document when needed</p>
                  </div>
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData({...formData, is_public: checked})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 flex-1">
                    {editingDocument ? 'Update Document' : 'Add Document'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {documents.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No documents added yet</h3>
                <p className="text-slate-400 mb-4">Add your first legacy document to get started</p>
                <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            documents.map((document) => (
              <Card key={document.id} className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{document.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={document.is_public ? "default" : "secondary"}>
                          {document.is_public ? 'Public' : 'Private'}
                        </Badge>
                        <span className="text-sm text-slate-400">
                          Created {formatDate(document.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {document.file_path && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(document)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(document.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {document.description && (
                      <p className="text-slate-300">{document.description}</p>
                    )}
                    {document.file_type && (
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>Type: {document.file_type}</span>
                        {document.file_size && (
                          <span>Size: {formatFileSize(document.file_size)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* File upload placeholder */}
        <Card className="bg-slate-800/50 border-slate-700 border-dashed">
          <CardContent className="text-center py-8">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h3 className="text-white mb-2">File Upload Coming Soon</h3>
            <p className="text-slate-400 text-sm">
              File upload functionality will be added in a future update. For now, you can create document references.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Documents;
