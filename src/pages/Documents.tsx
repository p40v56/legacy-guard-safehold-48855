import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePlan } from '@/hooks/usePlan';
import { useEncryption } from '@/contexts/EncryptionContext';
import { encryptFields, decryptFields, encryptFile, decryptFile } from '@/lib/crypto';
import UpgradePrompt from '@/components/UpgradePrompt';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Edit, Trash2, Download, Eye, Upload, Calendar, Shield, Link2 } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
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
  const { plan } = usePlan();
  const { vaultKey } = useEncryption();
  const isFreeBlocked = plan === 'free';
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
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Reverse-link map: document ID → list of asset/account names that reference it
  const [reverseLinks, setReverseLinks] = useState<Record<string, string[]>>({});

  const filteredDocuments = useMemo(() => {
    return documents.filter(document => {
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
      fetchReverseLinks();
    }
  }, [user, vaultKey]);

  const fetchReverseLinks = async () => {
    if (!user) return;
    try {
      const [financialsRes, accountsRes] = await Promise.all([
        supabase.from('financial_assets').select('name, name_iv, attached_document_ids').eq('user_id', user.id),
        supabase.from('accounts').select('account_name, account_name_iv, attached_document_ids').eq('user_id', user.id),
      ]);

      const linkMap: Record<string, string[]> = {};

      // Process financial assets
      for (const asset of (financialsRes.data || [])) {
        const docIds = asset.attached_document_ids as string[] | null;
        if (!docIds || docIds.length === 0) continue;
        let assetName = asset.name;
        if (vaultKey && asset.name_iv) {
          try {
            const dec = await decryptFields(asset, ['name'], vaultKey);
            assetName = dec.name || asset.name;
          } catch { /* use raw */ }
        }
        for (const docId of docIds) {
          if (!linkMap[docId]) linkMap[docId] = [];
          linkMap[docId].push(assetName);
        }
      }

      // Process accounts
      for (const acct of (accountsRes.data || [])) {
        const docIds = acct.attached_document_ids as string[] | null;
        if (!docIds || docIds.length === 0) continue;
        let acctName = acct.account_name;
        if (vaultKey && acct.account_name_iv) {
          try {
            const dec = await decryptFields(acct, ['account_name'], vaultKey);
            acctName = dec.account_name || acct.account_name;
          } catch { /* use raw */ }
        }
        for (const docId of docIds) {
          if (!linkMap[docId]) linkMap[docId] = [];
          linkMap[docId].push(acctName);
        }
      }

      setReverseLinks(linkMap);
    } catch (error) {
      console.error('Error fetching reverse links:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('legacy_documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const decryptedDocs = await Promise.all((data || []).map(async (doc) => {
        if (vaultKey) {
          const decryptedValues = await decryptFields(doc, ['title', 'description', 'content'], vaultKey);
          return { ...doc, ...decryptedValues };
        }
        return doc;
      }));
      
      setDocuments(decryptedDocs);
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
    if (!vaultKey) {
      toast({ title: "Vault Locked", description: "Please unlock your vault before saving.", variant: "destructive" });
      return;
    }
    
    try {
      let submissionData: any = {
        title: formData.title,
        document_type: formData.document_type,
        description: formData.description,
        is_public: formData.is_public,
        file_path: (formData as any).file_path || null,
        file_type: (formData as any).file_type || null,
        file_size: (formData as any).file_size || null,
      };

      if (vaultKey) {
        const encrypted = await encryptFields({
          title: formData.title,
          description: formData.description,
        }, vaultKey);
        submissionData = { ...submissionData, ...encrypted };
      }

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
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      let fileToUpload: Blob | File = file;
      let fileIv: string | null = null;

      if (vaultKey) {
        const arrayBuffer = await file.arrayBuffer();
        const { ciphertext, iv } = await encryptFile(arrayBuffer, vaultKey);
        fileToUpload = new Blob([ciphertext], { type: 'application/octet-stream' });
        fileIv = iv;
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully`,
      });
      
      setFormData(prev => ({
        ...prev,
        title: prev.title || file.name.split('.')[0],
        file_path: uploadData.path,
        file_type: file.type,
        file_size: file.size,
        file_iv: fileIv,
      } as any));
      
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

      let fileBlob = data;
      const docRecord = document as any;
      if (vaultKey && docRecord.file_iv) {
        const encryptedBuffer = await data.arrayBuffer();
        const decryptedBuffer = await decryptFile(encryptedBuffer, docRecord.file_iv, vaultKey);
        fileBlob = new Blob([decryptedBuffer], { type: document.file_type || 'application/octet-stream' });
      }

      const url = URL.createObjectURL(fileBlob);
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-medium text-card-foreground mb-2">Legacy Documents</h1>
            <p className="text-muted-foreground">
              Securely store and manage important documents for your digital legacy
            </p>
          </div>
          {!isFreeBlocked && (
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Document
            </Button>
          )}
        </div>

        {isFreeBlocked && (
          <UpgradePrompt message="Documents are a paid feature. Upgrade to store and share important documents with your trusted contacts securely." featureKey="documents" />
        )}

        {!isFreeBlocked && (<>
        {/* Search and Filter */}
        <div className="bg-muted/30 rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search documents..."
              className="bg-card/50 border-border"
            />
          </div>
          <Select value={filterVisibility} onValueChange={setFilterVisibility}>
            <SelectTrigger className="w-full sm:w-48 bg-card/50 border-border rounded-xl">
              <SelectValue placeholder="Filter by visibility" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border rounded-xl">
              <SelectItem value="all" className="rounded-lg">All Documents</SelectItem>
              <SelectItem value="private" className="rounded-lg">Private Only</SelectItem>
              <SelectItem value="public" className="rounded-lg">Public Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-muted/30 rounded-2xl p-6">
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
                <Label className="text-card-foreground">Document Content</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({...formData, description: value})}
                  placeholder="Write your document content here — supports formatting..."
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
            <div className="bg-muted/30 rounded-2xl p-12 text-center">
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
              {filteredDocuments.map((document) => {
                const links = reverseLinks[document.id];
                return (
                  <Card key={document.id} className="bg-muted/30 border-none rounded-2xl hover:bg-muted/50 transition-all duration-300 group">
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

                          {/* Reverse links - "Used by" indicator */}
                          {links && links.length > 0 && (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs text-muted-foreground">Linked to:</span>
                              {links.map((name, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                                  {name}
                                </span>
                              ))}
                            </div>
                          )}
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
                            onClick={() => setDeleteTargetId(document.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        </>)}

        <ConfirmationDialog
          open={!!deleteTargetId}
          onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}
          title="Delete Document"
          description="Are you sure you want to delete this document? This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
          onConfirm={() => { if (deleteTargetId) handleDelete(deleteTargetId); setDeleteTargetId(null); }}
        />
      </div>
    </DashboardLayout>
  );
};

export default Documents;
