import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, Plus, Trash2, Info, ChevronDown, Save } from 'lucide-react';
import RichTextEditor from '@/components/ui/rich-text-editor';

type ContactCategory = 'immediate_family' | 'extended_family' | 'close_friends' | 'professional' | 'legal' | 'financial';

interface ActivationRule {
  id: string;
  target_type: 'category' | 'contacts';
  contact_category?: ContactCategory;
  contact_ids?: string[];
  delay_hours: number;
  custom_message: string;
  enabled: boolean;
}

interface Contact {
  id: string;
  name: string;
  relationship?: string;
  [key: string]: any;
}

interface NotificationTimelineProps {
  activationRules: ActivationRule[];
  emergencyContacts: Contact[];
  contactTypeLabels: Record<ContactCategory, string>;
  addActivationRule: () => void;
  updateActivationRule: (id: string, updates: Partial<ActivationRule>) => void;
  deleteActivationRule: (id: string) => void;
  toggleContactSelection: (ruleId: string, contactId: string) => void;
  saveActivationRules: () => void;
}

const WaveCard = ({
  rule,
  emergencyContacts,
  contactTypeLabels,
  updateActivationRule,
  deleteActivationRule,
  toggleContactSelection,
}: {
  rule: ActivationRule;
  emergencyContacts: Contact[];
  contactTypeLabels: Record<ContactCategory, string>;
  updateActivationRule: (id: string, updates: Partial<ActivationRule>) => void;
  deleteActivationRule: (id: string) => void;
  toggleContactSelection: (ruleId: string, contactId: string) => void;
}) => {
  const isImmediate = rule.delay_hours === 0;
  const [showMessage, setShowMessage] = useState(!!rule.custom_message && rule.custom_message !== '<p><br></p>' && rule.custom_message.replace(/<[^>]*>/g, '').trim().length > 0);
  const waveLabel = isImmediate ? '⚡ Immediate notification' : `⏱ After ${rule.delay_hours} hours`;

  return (
    <div className="border border-border rounded-2xl p-5 space-y-4 bg-card/50">
      {/* Wave header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-card-foreground">{waveLabel}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${rule.enabled ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
            {rule.enabled ? 'Active' : 'Disabled'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={rule.enabled} onCheckedChange={(v) => updateActivationRule(rule.id, { enabled: v })} />
          <button onClick={() => deleteActivationRule(rule.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* When to notify */}
      <div className="space-y-3 p-4 bg-muted/20 rounded-xl">
        <Label className="text-card-foreground font-medium">When to notify</Label>
        <div className="flex items-center gap-3">
          <Switch
            checked={isImmediate}
            onCheckedChange={(checked) => updateActivationRule(rule.id, { delay_hours: checked ? 0 : 24 })}
          />
          <span className="text-sm text-card-foreground">
            {isImmediate ? 'Notify immediately when switch fires' : 'Notify after a delay'}
          </span>
        </div>
        {!isImmediate && (
          <div className="flex items-center gap-2 mt-2">
            <Input
              type="number"
              min={1}
              max={720}
              value={rule.delay_hours}
              onChange={e => updateActivationRule(rule.id, { delay_hours: parseInt(e.target.value) || 1 })}
              className="w-24 bg-muted/30 border-border rounded-xl h-10"
            />
            <span className="text-sm text-muted-foreground">hours after switch fires</span>
          </div>
        )}
      </div>

      {/* Who receives */}
      <div className="space-y-2">
        <Label className="text-card-foreground font-medium">Who receives this notification</Label>
        <Select value={rule.target_type} onValueChange={(v) => updateActivationRule(rule.id, { target_type: v as 'category' | 'contacts', contact_category: v === 'category' ? 'immediate_family' : undefined, contact_ids: v === 'contacts' ? [] : undefined })}>
          <SelectTrigger className="bg-muted/30 border-border rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="category">A contact category (immediate family, legal, etc.)</SelectItem>
            <SelectItem value="contacts">Specific contacts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rule.target_type === 'category' && (
        <div className="space-y-2">
          <Label className="text-card-foreground font-medium">Category</Label>
          <Select value={rule.contact_category} onValueChange={value => updateActivationRule(rule.id, { contact_category: value as ContactCategory })}>
            <SelectTrigger className="bg-muted/30 border-border rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {Object.entries(contactTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {rule.target_type === 'contacts' && (
        <div className="space-y-2">
          <Label className="text-card-foreground font-medium">Select contacts</Label>
          {emergencyContacts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No contacts available. Add contacts first.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {emergencyContacts.map(contact => (
                <div key={contact.id} className="flex items-center space-x-2">
                  <Checkbox id={`contact-${rule.id}-${contact.id}`} checked={(rule.contact_ids || []).includes(contact.id)} onCheckedChange={() => toggleContactSelection(rule.id, contact.id)} />
                  <label htmlFor={`contact-${rule.id}-${contact.id}`} className="text-sm text-card-foreground cursor-pointer flex-1">{contact.name} {contact.relationship && `(${contact.relationship})`}</label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom message — collapsed by default */}
      <div className="mt-4">
        {!showMessage ? (
          <button
            type="button"
            onClick={() => setShowMessage(true)}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add a personal message for this wave
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-card-foreground font-medium">Personal message</Label>
              <button
                type="button"
                onClick={() => { setShowMessage(false); updateActivationRule(rule.id, { custom_message: '' }); }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove message
              </button>
            </div>
            <p className="text-xs text-muted-foreground">This message is included in the notification email alongside their portal access link.</p>
            <RichTextEditor
              value={rule.custom_message}
              onChange={(value) => updateActivationRule(rule.id, { custom_message: value })}
              placeholder="Write a personal message for this wave's recipients..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationTimeline = ({
  activationRules,
  emergencyContacts,
  contactTypeLabels,
  addActivationRule,
  updateActivationRule,
  deleteActivationRule,
  toggleContactSelection,
  saveActivationRules,
}: NotificationTimelineProps) => {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Sort rules by delay_hours for visual timeline order
  const sortedRules = [...activationRules].sort((a, b) => a.delay_hours - b.delay_hours);

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-card-foreground">Who gets notified, and when</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          When your switch fires, these contacts will be notified in waves. Set up immediate notifications for family, and delayed notifications for professionals.
        </p>
      </div>

      {/* How it works — collapsed */}
      <div>
        <button
          onClick={() => setShowHowItWorks(p => !p)}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Info className="w-4 h-4" />
          How does this work?
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHowItWorks ? 'rotate-180' : ''}`} />
        </button>
        {showHowItWorks && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-3 text-sm text-muted-foreground space-y-1">
            <p>• When your check-in deadline is missed, your switch activates</p>
            <p>• Contacts in the first wave are notified immediately</p>
            <p>• Subsequent waves are notified after their configured delay</p>
            <p>• Each contact receives access to their portal and any personal message you've written</p>
            <p>• Contacts only see information you've explicitly shared with them</p>
          </div>
        )}
      </div>

      {/* Empty state */}
      {sortedRules.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Bell className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-medium text-card-foreground">No notification waves yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Add your first wave to define who gets notified when your switch fires. Most people start with an immediate notification to close family.
          </p>
          <Button onClick={addActivationRule} className="bg-primary hover:bg-primary/90 rounded-xl mt-2">
            <Plus className="w-4 h-4 mr-2" />
            Add first notification wave
          </Button>
        </div>
      ) : (
        <>
          {/* Timeline of waves */}
          <div className="space-y-4">
            {sortedRules.map((rule) => (
              <WaveCard
                key={rule.id}
                rule={rule}
                emergencyContacts={emergencyContacts}
                contactTypeLabels={contactTypeLabels}
                updateActivationRule={updateActivationRule}
                deleteActivationRule={deleteActivationRule}
                toggleContactSelection={toggleContactSelection}
              />
            ))}
          </div>

          {/* Add wave + save */}
          <div className="flex items-center justify-between pt-2">
            <Button onClick={addActivationRule} size="sm" variant="outline" className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add notification wave
            </Button>
            <Button onClick={saveActivationRules} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6">
              Save changes
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationTimeline;
