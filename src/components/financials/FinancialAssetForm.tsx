import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { CURRENCIES, getCurrency, DEFAULT_CURRENCY, formatNumberWithSeparators, stripFormatting } from '@/lib/currency';
import type { CurrencyCode } from '@/lib/currency';
import type { FinancialAsset, FinancialCategory, FinancialAssetInsert } from '@/types/financial';
import { CATEGORY_LABELS } from '@/types/financial';
import { useContacts } from '@/hooks/useContacts';
import { useAuth } from '@/hooks/useAuth';
import { useEncryption } from '@/contexts/EncryptionContext';
import { supabase } from '@/integrations/supabase/client';
import { decryptFields } from '@/lib/crypto';

interface FinancialAssetFormProps {
  initialData?: FinancialAsset | null;
  onSubmit: (data: FinancialAssetInsert) => void;
  onCancel: () => void;
}

const FinancialAssetForm: React.FC<FinancialAssetFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { contacts } = useContacts();
  const { user } = useAuth();
  const { vaultKey } = useEncryption();
  const [category, setCategory] = useState<FinancialCategory>(initialData?.category || 'bank_account');
  const [name, setName] = useState(initialData?.name || '');
  const [institution, setInstitution] = useState(initialData?.institution || '');
  const [estimatedValue, setEstimatedValue] = useState(initialData?.estimated_value?.toString() || '');
  const [displayValue, setDisplayValue] = useState(
    initialData?.estimated_value ? formatNumberWithSeparators(initialData.estimated_value.toString()) : ''
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    (initialData?.category_specific_fields as any)?.currency || DEFAULT_CURRENCY
  );
  const [contactName, setContactName] = useState(initialData?.contact_name || '');
  const [contactPhone, setContactPhone] = useState(initialData?.contact_phone || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contact_email || '');
  const [referenceNumber, setReferenceNumber] = useState(initialData?.reference_number || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [csf, setCsf] = useState<Record<string, any>>(initialData?.category_specific_fields || {});
  const [visibleToAll, setVisibleToAll] = useState(!initialData?.visible_to || initialData.visible_to.length === 0);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(initialData?.visible_to || []);
  const [attachedDocIds, setAttachedDocIds] = useState<string[]>(initialData?.attached_document_ids || []);
  const [availableDocs, setAvailableDocs] = useState<{id: string; title: string; document_type: string}[]>([]);
  const [showAllDocs, setShowAllDocs] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchDocs = async () => {
      const { data } = await supabase
        .from('legacy_documents')
        .select('id, title, title_iv, document_type')
        .eq('user_id', user.id);
      if (!data) return;
      const docs = await Promise.all(data.map(async (doc) => {
        let title = doc.title;
        if (vaultKey && doc.title_iv) {
          try {
            const decrypted = await decryptFields(doc, ['title'], vaultKey);
            title = decrypted.title || doc.title;
          } catch { /* use raw */ }
        }
        return { id: doc.id, title, document_type: doc.document_type };
      }));
      setAvailableDocs(docs);
    };
    fetchDocs();
  }, [user, vaultKey]);

  const updateCsf = (key: string, value: any) => setCsf(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      category,
      name,
      institution: institution || null,
      estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
      contact_name: contactName || null,
      contact_phone: contactPhone || null,
      contact_email: contactEmail || null,
      reference_number: referenceNumber || null,
      notes: notes || null,
      category_specific_fields: csf,
      visible_to: visibleToAll ? null : (selectedContactIds.length > 0 ? selectedContactIds : null),
      attached_document_ids: attachedDocIds.length > 0 ? attachedDocIds : null,
    });
  };

  const visibleDocs = showAllDocs ? availableDocs : availableDocs.slice(0, 5);

  return (
    <div className="bg-muted/30 rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <PoundSterling className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-medium text-card-foreground">
          {initialData ? 'Edit Financial Asset' : 'Add Financial Asset'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category & Name */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-card-foreground">Category *</Label>
            <Select value={category} onValueChange={(v) => { setCategory(v as FinancialCategory); setCsf({}); }}>
              <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {(Object.entries(CATEGORY_LABELS) as [FinancialCategory, string][]).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-card-foreground">Asset Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" placeholder="e.g. Barclays Current Account" required />
          </div>
        </div>

        {/* Institution & Value */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-card-foreground">Institution / Provider</Label>
            <Input value={institution} onChange={e => setInstitution(e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" placeholder="e.g. Barclays, Aviva" />
          </div>
          <div className="space-y-2">
            <Label className="text-card-foreground">Estimated Value (£)</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={estimatedValue}
                onChange={e => setEstimatedValue(e.target.value)}
                placeholder="0.00"
                className="pl-8 h-12 bg-muted/50 border-border rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Reference */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-card-foreground">Reference / Account Number</Label>
            <Input value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" placeholder="Account or policy number" />
          </div>
        </div>

        {/* Institution contact section header */}
        <div>
          <div className="flex items-center gap-2 mt-2 mb-1">
            <h4 className="text-sm font-medium text-card-foreground">Institution contact details</h4>
            <span className="text-xs text-muted-foreground">— who to call when the switch fires</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">These details will be shown to your trusted contacts so they can reach the right person.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-card-foreground">Contact Person</Label>
            <Input value={contactName} onChange={e => setContactName(e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" placeholder="Name of person to contact" />
          </div>
          <div className="space-y-2">
            <Label className="text-card-foreground">Contact Phone</Label>
            <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" placeholder="+44..." />
          </div>
          <div className="space-y-2">
            <Label className="text-card-foreground">Contact Email</Label>
            <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" placeholder="contact@institution.com" />
          </div>
        </div>

        {/* Category-specific fields */}
        {category === 'bank_account' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-card-foreground">Account Type</Label>
              <Select value={csf.account_subtype || ''} onValueChange={v => updateCsf('account_subtype', v)}>
                <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="joint">Joint</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Sort Code</Label>
              <Input
                value={csf.sort_code || ''}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                  const formatted = raw.length > 4
                    ? `${raw.slice(0,2)}-${raw.slice(2,4)}-${raw.slice(4)}`
                    : raw.length > 2
                    ? `${raw.slice(0,2)}-${raw.slice(2)}`
                    : raw;
                  updateCsf('sort_code', formatted);
                }}
                className="h-12 bg-muted/50 border-border rounded-xl"
                placeholder="00-00-00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Joint Account Holder</Label>
              <Input value={csf.joint_holder || ''} onChange={e => updateCsf('joint_holder', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" placeholder="Name if applicable" />
            </div>
          </div>
        )}

        {category === 'insurance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-card-foreground">Policy Number</Label>
                <Input value={csf.policy_number || ''} onChange={e => updateCsf('policy_number', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Policy Type</Label>
                <Select value={csf.policy_type || ''} onValueChange={v => updateCsf('policy_type', v)}>
                  <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {['Life', 'Health', 'Home', 'Car', 'Travel', 'Other'].map(t => (
                      <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Coverage Amount (£)</Label>
                <Input type="number" value={csf.coverage_amount || ''} onChange={e => updateCsf('coverage_amount', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Premium</Label>
                <Input value={csf.premium || ''} onChange={e => updateCsf('premium', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" placeholder="e.g. £50/month" />
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Beneficiary</Label>
                <Input value={csf.beneficiary || ''} onChange={e => updateCsf('beneficiary', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Policy Expiry Date</Label>
                <Input type="date" value={csf.expiry_date || ''} onChange={e => updateCsf('expiry_date', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Death Claim Process</Label>
              <p className="text-xs text-muted-foreground">Instructions for your contacts on how to make a claim — policy number to quote, forms to complete, deadlines to meet.</p>
              <Textarea
                value={csf.death_claim_process || ''}
                onChange={e => updateCsf('death_claim_process', e.target.value)}
                placeholder="e.g. Call 0800 XXX XXXX, quote policy number, request a death claim form. Submit within 6 months of death."
                className="min-h-[100px] bg-muted/50 border-border rounded-xl"
              />
            </div>
          </div>
        )}

        {category === 'investment' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-card-foreground">Platform</Label>
              <Input value={csf.platform || ''} onChange={e => updateCsf('platform', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" placeholder="e.g. Hargreaves Lansdown" />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Investment Type</Label>
              <Select value={csf.investment_type || ''} onValueChange={v => updateCsf('investment_type', v)}>
                <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {['Stocks', 'Bonds', 'ISA', 'Crypto', 'Funds', 'Other'].map(t => (
                    <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Nominated Beneficiary</Label>
              <Input value={csf.beneficiary || ''} onChange={e => updateCsf('beneficiary', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" />
            </div>
          </div>
        )}

        {category === 'pension' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-card-foreground">Pension Type</Label>
              <Select value={csf.pension_type || ''} onValueChange={v => updateCsf('pension_type', v)}>
                <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {['Workplace', 'Private', 'State', 'SIPP'].map(t => (
                    <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Nominated Beneficiary</Label>
              <Input value={csf.beneficiary || ''} onChange={e => updateCsf('beneficiary', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={csf.expression_of_wish || false} onCheckedChange={v => updateCsf('expression_of_wish', v)} />
              <Label className="text-card-foreground">Expression of wish filed?</Label>
            </div>
          </div>
        )}

        {category === 'property' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-card-foreground">Address</Label>
              <Input value={csf.address || ''} onChange={e => updateCsf('address', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" placeholder="Full property address" />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Ownership Type</Label>
              <Select value={csf.ownership_type || ''} onValueChange={v => updateCsf('ownership_type', v)}>
                <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="sole">Sole</SelectItem>
                  <SelectItem value="joint_tenants">Joint Tenants</SelectItem>
                  <SelectItem value="tenants_in_common">Tenants in Common</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Mortgage Provider</Label>
              <Input value={csf.mortgage_provider || ''} onChange={e => updateCsf('mortgage_provider', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Outstanding Mortgage (£)</Label>
              <Input type="number" value={csf.outstanding_mortgage || ''} onChange={e => updateCsf('outstanding_mortgage', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Co-owner</Label>
              <Input value={csf.co_owner || ''} onChange={e => updateCsf('co_owner', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" />
            </div>
          </div>
        )}

        {category === 'debt' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-card-foreground">Creditor Name</Label>
              <Input value={csf.creditor_name || ''} onChange={e => updateCsf('creditor_name', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Debt Type</Label>
              <Select value={csf.debt_type || ''} onValueChange={v => updateCsf('debt_type', v)}>
                <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {['Mortgage', 'Personal Loan', 'Credit Card', 'Student Loan', 'Other'].map(t => (
                    <SelectItem key={t} value={t.toLowerCase().replace(' ', '_')}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Outstanding Balance (£)</Label>
              <Input type="number" value={csf.outstanding_balance || ''} onChange={e => updateCsf('outstanding_balance', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Monthly Payment (£)</Label>
              <Input type="number" value={csf.monthly_payment || ''} onChange={e => updateCsf('monthly_payment', e.target.value)} className="h-12 bg-muted/50 border-border rounded-xl" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={csf.has_insurance || false} onCheckedChange={v => updateCsf('has_insurance', v)} />
              <Label className="text-card-foreground">Insurance on this debt?</Label>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-card-foreground">Notes</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="bg-muted/50 border-border rounded-xl" rows={4} placeholder="Important details, instructions..." />
        </div>

        {/* Visibility */}
        <div className="space-y-4">
          <Label className="text-card-foreground font-medium">Visible To</Label>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
            <Switch checked={visibleToAll} onCheckedChange={setVisibleToAll} />
            <div>
              <div className="font-medium text-card-foreground text-sm">All contacts</div>
              <p className="text-xs text-muted-foreground">Share this asset with every trusted contact</p>
            </div>
          </div>
          {!visibleToAll && contacts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {contacts.map(c => (
                <div key={c.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`vis-${c.id}`}
                    checked={selectedContactIds.includes(c.id)}
                    onCheckedChange={(checked) => {
                      setSelectedContactIds(prev =>
                        checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                      );
                    }}
                  />
                  <label htmlFor={`vis-${c.id}`} className="text-sm text-card-foreground cursor-pointer">{c.name}</label>
                </div>
              ))}
            </div>
          )}
          {!visibleToAll && contacts.length === 0 && (
            <p className="text-xs text-muted-foreground">No contacts available. Add contacts first.</p>
          )}
        </div>

        {/* Linked Documents */}
        <div className="space-y-4">
          <Label className="text-card-foreground font-medium">Linked Documents</Label>
          <p className="text-xs text-muted-foreground">Attach relevant documents (e.g. policy PDF, deed, certificate)</p>
          {availableDocs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {visibleDocs.map(doc => (
                  <div key={doc.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`doc-${doc.id}`}
                      checked={attachedDocIds.includes(doc.id)}
                      onCheckedChange={(checked) => {
                        setAttachedDocIds(prev =>
                          checked ? [...prev, doc.id] : prev.filter(id => id !== doc.id)
                        );
                      }}
                    />
                    <label htmlFor={`doc-${doc.id}`} className="text-sm text-card-foreground cursor-pointer flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      {doc.title}
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{doc.document_type}</Badge>
                    </label>
                  </div>
                ))}
              </div>
              {availableDocs.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllDocs(p => !p)}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  {showAllDocs ? 'Show less' : `Show all ${availableDocs.length} documents`}
                </button>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">No documents yet. Upload documents in the Documents section first.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" className="bg-primary hover:bg-primary/90 rounded-full px-6">
            {initialData ? 'Update Asset' : 'Add Asset'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default FinancialAssetForm;
