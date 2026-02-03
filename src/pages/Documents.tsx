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
import { FileText, Plus, Edit, Trash2, Download, Eye, Upload, Calendar, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import SearchInput from '@/components/ui/search-input';
import { FileUpload } from '@/components/ui/file-upload';

interface LegacyDocument {
  id: string;
  title: string;
  document_type: string;
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
    document_type: 'legal',
    description: '',
    is_public: false,
  });
  const [uploading, setUploading] = useState(false);

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
      const submissionData = {
        title: formData.title,
        document_type: formData.document_type,
        description: formData.description,
        is_public: formData.is_public,
        file_path: (formData as any).file_path || null,
        file_type: (formData as any).file_type || null,
        file_size: (formData as any).file_size || null,
      };

      if (editingDocument) {
        const { error } = await supabase
          .from('legacy_documents')
          .update(submissionData)
          .eq('id', editingDocument.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Document updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('legacy_documents')
          .insert([{ ...submissionData, user_id: user?.id }]);
        
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
      document_type: document.document_type,
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

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully`,
      });
      
      // Update form data with file info
      setFormData(prev => ({
        ...prev,
        title: prev.title || file.name.split('.')[0],
        file_path: uploadData.path,
        file_type: file.type,
        file_size: file.size
      }));
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      document_type: 'legal',
      description: '',
      is_public: false,
    });
    setShowAddForm(false);
    setEditingDocument(null);
  };

  const handleDownload = async (document: LegacyDocument) => {
    if (!document.file_path) {
      toast({
        title: "No file",
        description: "This document has no associated file to download",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.title + (document.file_type?.includes('pdf') ? '.pdf' : '');
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `${document.title} is being downloaded`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
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
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center animate-pulse">
            <FileText className="w-6 h-6 text-primary" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="page-header flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-medium mb-2">Legacy Documents</h1>
            <p>
              Securely store and manage important documents for your digital legacy
            </p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-white text-primary hover:bg-white/90 rounded-full px-6 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Document
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search documents..."
              className="bg-muted/50 border-none"
            />
          </div>
          <Select value={filterVisibility} onValueChange={setFilterVisibility}>
            <SelectTrigger className="w-full sm:w-48 bg-muted/50 border-none">
              <SelectValue placeholder="Filter by visibility" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="private">Private Only</SelectItem>
              <SelectItem value="public">Public Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="glass rounded-3xl p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-card-foreground">
                {editingDocument ? 'Edit Document' : 'Add New Document'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-card-foreground">Document Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="h-12 bg-muted/50 border-border rounded-xl"
                    placeholder="Last Will and Testament"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-card-foreground">Document Type *</Label>
                  <Select value={formData.document_type} onValueChange={(value) => setFormData({...formData, document_type: value})}>
                    <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-card-foreground">Visibility</Label>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                    <div>
                      <div className="font-medium text-card-foreground">Make Public</div>
                      <p className="text-sm text-muted-foreground">Allow emergency contacts to access this document</p>
                    </div>
                    <Switch
                      checked={formData.is_public}
                      onCheckedChange={(checked) => setFormData({...formData, is_public: checked})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-card-foreground">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-muted/50 border-border rounded-xl"
                  rows={4}
                  placeholder="Brief description of the document and its importance..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-card-foreground">Upload File</Label>
                <FileUpload
                  onUpload={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  maxSize={10}
                  disabled={uploading}
                  className="bg-muted/30 border-border"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90 rounded-full px-6"
                >
                  {editingDocument ? 'Update Document' : 'Add Document'}
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

        {/* Documents List */}
        <div className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-card-foreground mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || filterVisibility !== 'all' 
                  ? 'No documents match your search criteria.' 
                  : 'Start by adding your first document.'}
              </p>
              {(!searchTerm && filterVisibility === 'all') && (
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-primary hover:bg-primary/90 rounded-full px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Document
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="glass border-border hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                            <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-foreground mb-1 truncate">{document.title}</h3>
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant={document.is_public ? "default" : "secondary"} 
                                className={`text-xs font-medium ${
                                  document.is_public 
                                    ? 'bg-success/20 text-success border-success/30' 
                                    : 'bg-muted text-muted-foreground border-border'
                                }`}
                              >
                                {document.is_public ? 'Public' : 'Private'}
                              </Badge>
                              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                <Calendar className="w-3 h-3" />
                                {new Date(document.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {document.description && (
                          <p className="text-muted-foreground mb-4 leading-relaxed">{document.description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {document.file_type && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground font-medium">Type:</span>
                              <span className="text-foreground">{document.file_type}</span>
                            </div>
                          )}
                          
                          {document.file_size && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground font-medium">Size:</span>
                              <span className="text-foreground">{formatFileSize(document.file_size)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-6">
                        {document.file_path && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground hover:bg-muted h-10 w-10 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(document)}
                              className="text-muted-foreground hover:text-foreground hover:bg-muted h-10 w-10 p-0"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(document)}
                          className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(document.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 p-0"
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

export default Documents;
