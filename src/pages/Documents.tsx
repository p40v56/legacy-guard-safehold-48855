
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Edit, Trash2, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import SearchInput from '@/components/ui/search-input';

interface LegacyDocument {
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
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<LegacyDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<LegacyDocument | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false,
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter(document => {
      // Safe string conversion with null checks
      const title = (document.title || '').toLowerCase();
      const description = (document.description || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = !searchTerm || 
        title.includes(searchLower) ||
        description.includes(searchLower);
      
      let matchesFilter = true;
      if (filterVisibility === 'public') {
        matchesFilter = document.is_public;
      } else if (filterVisibility === 'private') {
        matchesFilter = !document.is_public;
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [documents, searchTerm, filterVisibility]);

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

  const handleEdit = (document: LegacyDocument) => {
    setFormData({
      title: document.title,
      description: document.description || '',
      is_public: document.is_public,
    });
    setEditingDocument(document);
    setShowAddForm(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const { error } = await supabase
        .from('legacy_documents')
        .delete()
        .eq('id', documentId);
      
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
    setShowAddForm(false);
    setEditingDocument(null);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" className="text-emerald-400 mx-auto mb-4" />
            <p className="text-slate-400">Loading documents...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Legacy Documents</h1>
            <p className="text-slate-400">Store and manage important documents for your legacy</p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Document
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search documents..."
            />
          </div>
          <Select value={filterVisibility} onValueChange={setFilterVisibility}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Filter by visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="w-5 h-5 mr-2 text-emerald-400" />
                {editingDocument ? 'Edit Document' : 'Add New Document'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-slate-200">Document Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Last Will and Testament"
                    required
                  />
                </div>

                <div>
                  <Label className="text-slate-200">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                    placeholder="Brief description of the document..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">Make Public</Label>
                    <p className="text-xs text-slate-400">Allow emergency contacts to access this document</p>
                  </div>
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData({...formData, is_public: checked})}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500">
                    {editingDocument ? 'Update Document' : 'Add Document'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Documents List */}
        <div className="grid gap-4">
          {filteredDocuments.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No documents found</h3>
                <p className="text-slate-400 mb-4">
                  {searchTerm || filterVisibility !== 'all' 
                    ? 'No documents match your search criteria.' 
                    : 'Get started by adding your first legacy document.'}
                </p>
                {(!searchTerm && filterVisibility === 'all') && (
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Document
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredDocuments.map((document) => (
              <Card key={document.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-white">{document.title}</h3>
                        <Badge variant={document.is_public ? "default" : "secondary"} className="text-xs">
                          {document.is_public ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                      
                      {document.description && (
                        <p className="text-slate-300 mb-3">{document.description}</p>
                      )}
                      
                      <div className="space-y-2 text-sm">
                        {document.file_type && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Type:</span>
                            <span className="text-white">{document.file_type}</span>
                          </div>
                        )}
                        
                        {document.file_size && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Size:</span>
                            <span className="text-white">{formatFileSize(document.file_size)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Created:</span>
                          <span className="text-slate-300">
                            {new Date(document.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
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
                        onClick={() => handleEdit(document)}
                        className="text-slate-400 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
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

export default Documents;
