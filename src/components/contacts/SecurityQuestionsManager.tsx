import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { KeyRound, Plus, Trash2, Shield, Pencil, Eye, EyeOff, X, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEncryption } from '@/contexts/EncryptionContext';
import { encryptText } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';
import { ContactType, EmergencyContact } from '@/types/access-control';


const PBKDF2_ITERATIONS = 310_000;

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function randomSaltB64(): string {
  return bytesToB64(crypto.getRandomValues(new Uint8Array(16)));
}

async function pbkdf2HashAnswer(answer: string, saltB64: string, iterations: number): Promise<string> {
  const encoder = new TextEncoder();
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(answer.trim().toLowerCase()),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: b64ToBytes(saltB64), iterations, hash: 'SHA-256' },
    material,
    256
  );
  return bytesToB64(new Uint8Array(bits));
}

interface SecurityQuestion {
  id: string;
  question: string;
  answer_hash: string;
  hint: string | null;
  target_type: 'all' | 'category' | 'contact';
  target_contact_type: string | null;
  target_contact_id: string | null;
  kdf_salt?: string | null;
  kdf_iterations?: number | null;
}

interface SecurityQuestionsManagerProps {
  contacts: EmergencyContact[];
  contactTypeLabels: Record<ContactType, string>;
}

const SecurityQuestionsManager = ({ contacts, contactTypeLabels }: SecurityQuestionsManagerProps) => {
  const { user } = useAuth();
  const { vaultKey } = useEncryption();
  const [confirmDeleteQId, setConfirmDeleteQId] = useState<string | null>(null);
  const { toast } = useToast();

  const [questions, setQuestions] = useState<SecurityQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newHint, setNewHint] = useState('');
  const [newTargetType, setNewTargetType] = useState<'all' | 'category' | 'contact'>('all');
  const [newTargetContactType, setNewTargetContactType] = useState<string>('');
  const [newTargetContactId, setNewTargetContactId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editHint, setEditHint] = useState('');
  const [editTargetType, setEditTargetType] = useState<'all' | 'category' | 'contact'>('all');
  const [editTargetContactType, setEditTargetContactType] = useState<string>('');
  const [editTargetContactId, setEditTargetContactId] = useState<string>('');
  const [showEditAnswer, setShowEditAnswer] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (user) fetchQuestions();
  }, [user]);

  const fetchQuestions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('security_questions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setQuestions((data || []) as SecurityQuestion[]);
    } catch (error) {
      console.error('Error fetching security questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!user || !newQuestion.trim() || !newAnswer.trim()) return;
    if (!vaultKey) {
      toast({ title: 'Vault locked', description: 'Unlock your vault before adding security questions.', variant: 'destructive' });
      return;
    }
    setSaving(true);

    try {
      const answerHash = await hashAnswer(newAnswer);
      // answer_ciphertext/answer_iv are read by src/lib/portalShares.ts to
      // derive the per-share AES-GCM key at portal-generation time (ZK model).
      // answer_hash is what supabase/functions/contact-portal verifies against.
      const { ciphertext, iv } = await encryptText(newAnswer.trim().toLowerCase(), vaultKey);
      const payload: any = {
        user_id: user.id,
        question: newQuestion.trim(),
        answer_hash: answerHash,
        answer_ciphertext: ciphertext,
        answer_iv: iv,
        hint: newHint.trim() || null,
        target_type: newTargetType,
        target_contact_type: newTargetType === 'category' ? newTargetContactType : null,
        target_contact_id: newTargetType === 'contact' ? newTargetContactId : null,
      };


      const { data, error } = await supabase
        .from('security_questions')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setQuestions(prev => [...prev, data as SecurityQuestion]);
      setNewQuestion('');
      setNewAnswer('');
      setNewHint('');
      setNewTargetType('all');
      setNewTargetContactType('');
      setNewTargetContactId('');

      toast({ title: 'Security question added', description: 'The question has been saved.' });
    } catch (error) {
      console.error('Error adding security question:', error);
      toast({ title: 'Error', description: 'Failed to add security question', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (q: SecurityQuestion) => {
    setEditingId(q.id);
    setEditQuestion(q.question);
    setEditAnswer(''); // Must re-enter — stored as hash
    setEditHint(q.hint || '');
    setEditTargetType(q.target_type);
    setEditTargetContactType(q.target_contact_type || '');
    setEditTargetContactId(q.target_contact_id || '');
    setShowEditAnswer(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowEditAnswer(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editQuestion.trim() || !editAnswer.trim()) return;
    if (!vaultKey) {
      toast({ title: 'Vault locked', description: 'Unlock your vault before editing security questions.', variant: 'destructive' });
      return;
    }
    setEditSaving(true);

    try {
      const answerHash = await hashAnswer(editAnswer);
      const { ciphertext, iv } = await encryptText(editAnswer.trim().toLowerCase(), vaultKey);
      const payload: any = {
        question: editQuestion.trim(),
        answer_hash: answerHash,
        answer_ciphertext: ciphertext,
        answer_iv: iv,
        hint: editHint.trim() || null,
        target_type: editTargetType,
        target_contact_type: editTargetType === 'category' ? editTargetContactType : null,
        target_contact_id: editTargetType === 'contact' ? editTargetContactId : null,
      };


      const { error } = await supabase
        .from('security_questions')
        .update(payload)
        .eq('id', editingId);

      if (error) throw error;

      setQuestions(prev => prev.map(q => q.id === editingId ? { ...q, ...payload } : q));
      setEditingId(null);
      setShowEditAnswer(false);
      toast({ title: 'Updated', description: 'Security question updated.' });
    } catch (error) {
      console.error('Error updating security question:', error);
      toast({ title: 'Error', description: 'Failed to update security question', variant: 'destructive' });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('security_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setQuestions(prev => prev.filter(q => q.id !== id));
      if (editingId === id) setEditingId(null);
      toast({ title: 'Deleted', description: 'Security question removed.' });
    } catch (error) {
      console.error('Error deleting security question:', error);
      toast({ title: 'Error', description: 'Failed to delete security question', variant: 'destructive' });
    }
  };

  const getTargetLabel = (q: SecurityQuestion) => {
    if (q.target_type === 'all') return 'All Contacts';
    if (q.target_type === 'category' && q.target_contact_type) {
      return contactTypeLabels[q.target_contact_type as ContactType] || q.target_contact_type;
    }
    if (q.target_type === 'contact' && q.target_contact_id) {
      const contact = contacts.find(c => c.id === q.target_contact_id);
      return contact?.name || 'Unknown Contact';
    }
    return 'Unknown';
  };

  const maskedAnswer = () => '••••••';
  const hasLegacyAnswers = questions.some(q => q.answer_hash.length !== 44);

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          Portal Security Questions
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Contacts must answer a security question before accessing the portal. 
          Questions assigned to a specific contact override category-level questions, which override the default.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasLegacyAnswers && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Security Update Required</p>
              <p className="text-xs text-muted-foreground mt-1">Your existing security question answers need to be re-entered to apply secure hashing. Please edit each question and re-type the answer.</p>
            </div>
          </div>
        )}
        {/* Existing questions */}
        {questions.length > 0 && (
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="p-4 bg-muted/30 rounded-xl border border-border">
                {editingId === q.id ? (
                  /* Edit mode */
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-foreground text-sm">Question</Label>
                      <Input value={editQuestion} onChange={e => setEditQuestion(e.target.value)} className="bg-card/50 border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground text-sm">Answer</Label>
                      <div className="relative">
                        <Input
                          type={showEditAnswer ? 'text' : 'password'}
                          value={editAnswer}
                          onChange={e => setEditAnswer(e.target.value)}
                          className="bg-card/50 border-border pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowEditAnswer(!showEditAnswer)}
                        >
                          {showEditAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground text-sm">Hint <span className="text-muted-foreground">(optional)</span></Label>
                      <Input value={editHint} onChange={e => setEditHint(e.target.value)} placeholder="A clue to help the contact" className="bg-card/50 border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground text-sm">Applies To</Label>
                      <Select value={editTargetType} onValueChange={(v: 'all' | 'category' | 'contact') => setEditTargetType(v)}>
                        <SelectTrigger className="bg-card/50 border-border"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="all">All Contacts</SelectItem>
                          <SelectItem value="category">Contact Category</SelectItem>
                          <SelectItem value="contact">Specific Contact</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editTargetType === 'category' && (
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Category</Label>
                        <Select value={editTargetContactType} onValueChange={setEditTargetContactType}>
                          <SelectTrigger className="bg-card/50 border-border"><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {Object.entries(contactTypeLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {editTargetType === 'contact' && (
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Contact</Label>
                        <Select value={editTargetContactId} onValueChange={setEditTargetContactId}>
                          <SelectTrigger className="bg-card/50 border-border"><SelectValue placeholder="Select contact" /></SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit} disabled={editSaving || !editQuestion.trim() || !editAnswer.trim()} size="sm">
                        <Check className="w-4 h-4 mr-1" />{editSaving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button onClick={cancelEdit} variant="ghost" size="sm">
                        <X className="w-4 h-4 mr-1" />Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <p className="text-foreground font-medium text-sm">{q.question}</p>
                      <p className="text-muted-foreground text-xs">Answer: {maskedAnswer()}</p>
                      {q.hint && (
                        <p className="text-muted-foreground text-xs">Hint: {q.hint}</p>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {q.target_type === 'all' && <Shield className="w-3 h-3 mr-1" />}
                        {getTargetLabel(q)}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(q)} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {confirmDeleteQId === q.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-destructive">Delete?</span>
                          <button onClick={() => { handleDelete(q.id); setConfirmDeleteQId(null); }} className="text-xs text-destructive hover:underline font-medium">Yes</button>
                          <button onClick={() => setConfirmDeleteQId(null)} className="text-xs text-muted-foreground hover:underline">No</button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteQId(q.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new question */}
        <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
          <h4 className="text-foreground font-medium text-sm">Add Security Question</h4>
          
          <div className="space-y-2">
            <Label className="text-foreground text-sm">Question</Label>
            <Input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="e.g. What was the name of our childhood pet?" className="bg-card/50 border-border" />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground text-sm">Answer</Label>
            <Input value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} placeholder="The exact answer the contact must provide" className="bg-card/50 border-border" />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground text-sm">Hint <span className="text-muted-foreground">(optional)</span></Label>
            <Input value={newHint} onChange={(e) => setNewHint(e.target.value)} placeholder="A clue to help the contact remember" className="bg-card/50 border-border" />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground text-sm">Applies To</Label>
            <Select value={newTargetType} onValueChange={(v: 'all' | 'category' | 'contact') => setNewTargetType(v)}>
              <SelectTrigger className="bg-card/50 border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Contacts</SelectItem>
                <SelectItem value="category">Contact Category</SelectItem>
                <SelectItem value="contact">Specific Contact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newTargetType === 'category' && (
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Category</Label>
              <Select value={newTargetContactType} onValueChange={setNewTargetContactType}>
                <SelectTrigger className="bg-card/50 border-border"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(contactTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {newTargetType === 'contact' && (
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Contact</Label>
              <Select value={newTargetContactId} onValueChange={setNewTargetContactId}>
                <SelectTrigger className="bg-card/50 border-border"><SelectValue placeholder="Select contact" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleAdd}
            disabled={saving || !newQuestion.trim() || !newAnswer.trim() || 
              (newTargetType === 'category' && !newTargetContactType) ||
              (newTargetType === 'contact' && !newTargetContactId)}
            className="bg-primary hover:bg-primary/90 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            {saving ? 'Adding...' : 'Add Question'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityQuestionsManager;
