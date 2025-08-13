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
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header Section with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-white/10 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 backdrop-blur-sm">
                    <FileText className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h1 className="text-4xl font-bold text-white">Legacy Documents</h1>
                </div>
                <p className="text-lg text-slate-300 max-w-2xl">
                  Securely store and manage important documents for your digital legacy. 
                  Keep your essential papers organized and accessible to trusted contacts.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm">End-to-end encrypted</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">Secure storage</span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setShowAddForm(true)}
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/25 border-0 text-white font-semibold px-8"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Document
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search documents by title or description..."
              className="h-12 text-base"
            />
          </div>
          <Select value={filterVisibility} onValueChange={setFilterVisibility}>
            <SelectTrigger className="w-full sm:w-56 h-12 bg-slate-800/50 border-slate-600 text-white backdrop-blur-sm">
              <SelectValue placeholder="Filter by visibility" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="private">Private Only</SelectItem>
              <SelectItem value="public">Public Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-sm shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center text-xl">
                <div className="p-2 rounded-lg bg-emerald-500/20 mr-3">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                {editingDocument ? 'Edit Document' : 'Add New Document'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">Document Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="bg-slate-700/50 border-slate-600 text-white h-12 backdrop-blur-sm"
                      placeholder="Last Will and Testament"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">Visibility</Label>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                      <div>
                        <div className="font-medium text-white">Make Public</div>
                        <p className="text-sm text-slate-400">Allow emergency contacts to access this document</p>
                      </div>
                      <Switch
                        checked={formData.is_public}
                        onCheckedChange={(checked) => setFormData({...formData, is_public: checked})}
                      />
                    </div>
                  </div>
                </div>

                 <div className="space-y-2">
                   <Label className="text-slate-200 font-medium">Description</Label>
                   <Textarea
                     value={formData.description}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                     className="bg-slate-700/50 border-slate-600 text-white backdrop-blur-sm"
                     rows={4}
                     placeholder="Brief description of the document and its importance..."
                   />
                 </div>

                 <div className="space-y-2">
                   <Label className="text-slate-200 font-medium">Upload File</Label>
                   <FileUpload
                     onUpload={handleFileUpload}
                     accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                     maxSize={10}
                     disabled={uploading}
                     className="bg-slate-700/30 border-slate-600"
                   />
                 </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg font-semibold"
                  >
                    {editingDocument ? 'Update Document' : 'Add Document'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Documents List */}
        <div className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="p-4 rounded-2xl bg-slate-700/30 w-fit mx-auto mb-6">
                    <FileText className="w-12 h-12 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">No documents found</h3>
                  <p className="text-slate-400 mb-6 leading-relaxed">
                    {searchTerm || filterVisibility !== 'all' 
                      ? 'No documents match your search criteria. Try adjusting your filters or search terms.' 
                      : 'Start building your digital legacy by adding your first important document.'}
                  </p>
                  {(!searchTerm && filterVisibility === 'all') && (
                    <Button 
                      onClick={() => setShowAddForm(true)}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Document
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-2 rounded-lg bg-slate-700/50 group-hover:bg-emerald-500/20 transition-colors">
                            <FileText className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white mb-1 truncate">{document.title}</h3>
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant={document.is_public ? "default" : "secondary"} 
                                className={`text-xs font-medium ${
                                  document.is_public 
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                    : 'bg-slate-600/50 text-slate-300 border-slate-500/50'
                                }`}
                              >
                                {document.is_public ? 'Public' : 'Private'}
                              </Badge>
                              <div className="flex items-center gap-1 text-slate-400 text-sm">
                                <Calendar className="w-3 h-3" />
                                {new Date(document.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {document.description && (
                          <p className="text-slate-300 mb-4 leading-relaxed">{document.description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {document.file_type && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-medium">Type:</span>
                              <span className="text-slate-300">{document.file_type}</span>
                            </div>
                          )}
                          
                          {document.file_size && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-medium">Size:</span>
                              <span className="text-slate-300">{formatFileSize(document.file_size)}</span>
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
                              className="text-slate-400 hover:text-white hover:bg-slate-700/50 h-10 w-10 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(document)}
                              className="text-slate-400 hover:text-white hover:bg-slate-700/50 h-10 w-10 p-0"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(document)}
                          className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 h-10 w-10 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(document.id)}
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

export default Documents;
