import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePlan } from '@/hooks/usePlan';
import { useEncryption } from '@/contexts/EncryptionContext';
import { encryptFields, decryptFields, encryptFile, decryptFile } from '@/lib/crypto';
import UpgradePrompt from '@/components/UpgradePrompt';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Plus, Edit, Trash2, Download, Eye, Calendar, Link2,
  Scale, Landmark, Heart, User, ShieldCheck, Home, HardDrive, FileUp
} from 'lucide-react';
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

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  legal: 'Legal',
  financial: 'Financial',
  medical: 'Medical',
  personal: 'Personal',
  insurance: 'Insurance',
  property: 'Property',
  other: 'Other',
};

const DOC_ICON_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  legal: { icon: <Scale className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-500/15' },
  financial: { icon: <Landmark className="w-5 h-5" />, color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
  medical: { icon: <Heart className="w-5 h-5" />, color: 'text-red-500', bg: 'bg-red-500/15' },
  personal: { icon: <User className="w-5 h-5" />, color: 'text-purple-500', bg: 'bg-purple-500/15' },
  insurance: { icon: <ShieldCheck className="w-5 h-5" />, color: 'text-amber-500', bg: 'bg-amber-500/15' },
  property: { icon: <Home className="w-5 h-5" />, color: 'text-orange-500', bg: 'bg-orange-500/15' },
  other: { icon: <FileText className="w-5 h-5" />, color: 'text-gray-400', bg: 'bg-gray-500/15' },
};

const Documents = () => {
  const { user } = useAuth();
  const { plan, limits } = usePlan();
  const { vaultKey } = useEncryption();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<LegacyDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name' | 'type'>('date_desc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<LegacyDocument | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    document_type: 'legal',
    description: '',
    content: '',
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

  const sortedDocuments = useMemo(() => {
    return [...filteredDocuments].sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'type') return (a.document_type || '').localeCompare(b.document_type || '');
      return 0;
    });
  }, [filteredDocuments, sortBy]);

  const isDocLimitReached = limits.maxDocuments !== Infinity && documents.length >= limits.maxDocuments;

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
        content: formData.content,
        is_public: formData.is_public,
        file_path: (formData as any).file_path || null,
        file_type: (formData as any).file_type || null,
        file_size: (formData as any).file_size || null,
      };

      if (vaultKey) {
        const encrypted = await encryptFields({
          title: formData.title,
          description: formData.description,
          content: formData.content,
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
      content: (document as any).content || '',
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
    if (!limits.fileUploads) {
      toast({ title: 'File uploads unavailable', description: 'File uploads require the Essential or Family plan. Free plan supports text documents only.', variant: 'destructive' });
      return;
    }

    if (limits.maxStorageMb > 0 && limits.maxStorageMb !== Infinity) {
      try {
        const { data: sizeData } = await supabase
          .from('legacy_documents')
          .select('file_size')
          .eq('user_id', user?.id);
        const totalMb = (sizeData || []).reduce((sum, d) => sum + (d.file_size || 0), 0) / (1024 * 1024);
        if (totalMb + (file.size / (1024 * 1024)) > limits.maxStorageMb) {
          toast({ title: 'Storage limit reached', description: `Your plan allows ${limits.maxStorageMb >= 1024 ? `${limits.maxStorageMb / 1024} GB` : `${limits.maxStorageMb} MB`} of storage. Upgrade to add more files.`, variant: 'destructive' });
          return;
        }
      } catch { /* proceed */ }
    }

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

  const formatDate = (doc: LegacyDocument) => {
    return new Date(doc.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
          {!isDocLimitReached && (
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Document
            </Button>
          )}
        </div>

        {isDocLimitReached && (
          <UpgradePrompt
            message={`Your plan allows up to ${limits.maxDocuments} document${limits.maxDocuments === 1 ? '' : 's'}. Upgrade to add more.`}
            featureKey="documents"
            requiredPlan={plan === 'essential' ? 'family' : 'essential'}
          />
        )}

        {<>
        {/* Search, Filter, Sort */}
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
              <SelectItem value="public" className="rounded-lg">Shared Only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-full sm:w-36 bg-card/50 border-border rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border rounded-xl">
              <SelectItem value="date_desc" className="rounded-lg">Newest first</SelectItem>
              <SelectItem value="date_asc" className="rounded-lg">Oldest first</SelectItem>
              <SelectItem value="name" className="rounded-lg">Name A–Z</SelectItem>
              <SelectItem value="type" className="rounded-lg">By type</SelectItem>
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

                {/* Description field — CHANGE 4 */}
                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-card-foreground">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description — shown in the document list without opening the file"
                    className="h-12 bg-muted/50 border-border rounded-xl"
                  />
                </div>

                {/* Visibility — CHANGE 3 */}
                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-card-foreground">Visibility</Label>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                    <div>
                      <div className="font-medium text-card-foreground">Share with all trusted contacts</div>
                      <p className="text-sm text-muted-foreground">When enabled, all your trusted contacts can see this document in their portal. When disabled, only contacts with specific document permissions can access it.</p>
                    </div>
                    <Switch
                      checked={formData.is_public}
                      onCheckedChange={(checked) => setFormData({...formData, is_public: checked})}
                    />
                  </div>
                </div>
              </div>

              {/* Document Content — CHANGE 2 helper */}
              <div className="space-y-2">
                <Label className="text-card-foreground">Document Content</Label>
                <p className="text-xs text-muted-foreground mb-2">Write directly, or upload a file below. You can do both.</p>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({...formData, description: value})}
                  placeholder="Write your document content here — supports formatting..."
                />
              </div>

              {/* "or" separator — CHANGE 2 */}
              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest px-2">or upload a file</span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* Upload — CHANGE 5 */}
              <div className="space-y-2">
                <Label className="text-card-foreground">Upload File</Label>
                {limits.fileUploads ? (
                  <>
                    <FileUpload
                      onUpload={handleFileUpload}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      maxSize={10}
                      disabled={uploading}
                      className="bg-muted/30 border-border"
                    />
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Accepted: PDF, Word (.doc, .docx), images (JPG, PNG) · Maximum 10 MB
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl">
                    File uploads require the Essential plan or higher. Free plan supports text documents only.
                  </div>
                )}
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
          {sortedDocuments.length === 0 ? (
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
              {sortedDocuments.map((document) => {
                const links = reverseLinks[document.id];
                const iconConfig = DOC_ICON_CONFIG[document.document_type] || DOC_ICON_CONFIG.other;
                return (
                  <Card key={document.id} className="bg-muted/30 border-none rounded-2xl hover:bg-muted/50 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-3">
                            {/* Type-specific icon — CHANGE 7 */}
                            <div className={`p-2 rounded-lg ${iconConfig.bg} transition-colors`}>
                              <span className={iconConfig.color}>{iconConfig.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-foreground mb-1 truncate">{document.title}</h3>
                              <div className="flex items-center gap-3 flex-wrap">
                                {/* Type label — CHANGE 6 */}
                                <Badge variant="outline" className="text-xs font-medium border-border text-muted-foreground">
                                  {DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type}
                                </Badge>
                                {/* Visibility badge — CHANGE 8 */}
                                <Badge 
                                  variant="secondary"
                                  className={`text-xs font-medium ${
                                    document.is_public 
                                      ? 'bg-success/20 text-success border border-success/30' 
                                      : 'bg-muted text-muted-foreground border-border'
                                  }`}
                                >
                                  {document.is_public ? 'Shared' : 'Private'}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Description — CHANGE 9 */}
                          {document.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{document.description}</p>
                          )}

                          {/* Date & file size — CHANGE 9 */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(document)}
                            </span>
                            {document.file_size && (
                              <span className="flex items-center gap-1">
                                <HardDrive className="w-3 h-3" />
                                {formatFileSize(document.file_size)}
                              </span>
                            )}
                          </div>

                          {/* Reverse links */}
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
        </>}

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
