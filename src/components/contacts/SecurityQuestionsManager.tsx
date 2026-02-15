import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { KeyRound, Plus, Trash2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ContactType, EmergencyContact } from '@/types/access-control';

interface SecurityQuestion {
  id: string;
  question: string;
  answer_hash: string;
  target_type: 'all' | 'category' | 'contact';
  target_contact_type: string | null;
  target_contact_id: string | null;
}

interface SecurityQuestionsManagerProps {
  contacts: EmergencyContact[];
  contactTypeLabels: Record<ContactType, string>;
}

const SecurityQuestionsManager = ({ contacts, contactTypeLabels }: SecurityQuestionsManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<SecurityQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newTargetType, setNewTargetType] = useState<'all' | 'category' | 'contact'>('all');
  const [newTargetContactType, setNewTargetContactType] = useState<string>('');
  const [newTargetContactId, setNewTargetContactId] = useState<string>('');
  const [saving, setSaving] = useState(false);

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
    setSaving(true);

    try {
      const payload: any = {
        user_id: user.id,
        question: newQuestion.trim(),
        answer_hash: newAnswer.trim(),
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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('security_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setQuestions(prev => prev.filter(q => q.id !== id));
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
        {/* Existing questions */}
        {questions.length > 0 && (
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="flex items-start justify-between gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                <div className="flex-1 space-y-1">
                  <p className="text-foreground font-medium text-sm">{q.question}</p>
                  <p className="text-muted-foreground text-xs">Answer: {q.answer_hash}</p>
                  <Badge variant="secondary" className="text-xs">
                    {q.target_type === 'all' && <Shield className="w-3 h-3 mr-1" />}
                    {getTargetLabel(q)}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(q.id)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new question */}
        <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
          <h4 className="text-foreground font-medium text-sm">Add Security Question</h4>
          
          <div className="space-y-2">
            <Label className="text-foreground text-sm">Question</Label>
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="e.g. What was the name of our childhood pet?"
              className="bg-card/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground text-sm">Answer</Label>
            <Input
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="The exact answer the contact must provide"
              className="bg-card/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground text-sm">Applies To</Label>
            <Select value={newTargetType} onValueChange={(v: 'all' | 'category' | 'contact') => setNewTargetType(v)}>
              <SelectTrigger className="bg-card/50 border-border">
                <SelectValue />
              </SelectTrigger>
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
                <SelectTrigger className="bg-card/50 border-border">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
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
                <SelectTrigger className="bg-card/50 border-border">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
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
