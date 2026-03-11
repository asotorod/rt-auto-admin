import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import {
  ArrowLeft, Save, Loader2, AlertCircle, User, Phone, Mail,
  MessageCircle, Car, Globe, Tag, Search
} from 'lucide-react';

const SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'cargurus', label: 'CarGurus' },
  { value: 'autotrader', label: 'AutoTrader' },
  { value: 'cars_com', label: 'Cars.com' },
  { value: 'carfax', label: 'Carfax' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'phone', label: 'Phone' },
  { value: 'referral', label: 'Referral' },
  { value: 'craigslist', label: 'Craigslist' },
  { value: 'other', label: 'Other' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'es', label: 'Spanish' },
];

const CONTACT_PREFS = [
  { value: 'phone', label: 'Phone' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
];

export default function LeadForm() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleSearch, setVehicleSearch] = useState('');

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    phone_secondary: '', whatsapp_number: '',
    preferred_contact: 'phone', preferred_language: 'en',
    source: 'walk_in', source_detail: '',
    vehicle_interest_id: '', vehicle_interest_text: '',
    assigned_to: profile?.id || '', notes: '',
  });

  useEffect(() => {
    if (profile?.dealership_id) { fetchTeam(); fetchVehicles(); }
  }, [profile]);

  async function fetchTeam() {
    const { data } = await supabase.from('user_profiles')
      .select('id, first_name, last_name, role')
      .eq('dealership_id', profile.dealership_id).order('first_name');
    setTeamMembers(data || []);
  }

  async function fetchVehicles() {
    const { data } = await supabase.from('vehicles')
      .select('id, year, make, model, trim, stock_number, asking_price')
      .eq('dealership_id', profile.dealership_id)
      .eq('status', 'active').order('year', { ascending: false });
    setVehicles(data || []);
  }

  async function handleSave() {
    if (!form.first_name.trim()) { setError('First name is required'); return; }
    if (!form.phone && !form.email) { setError('Phone or email is required'); return; }
    setSaving(true);
    setError('');
    try {
      const leadData = {
        dealership_id: profile.dealership_id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        phone_secondary: form.phone_secondary.trim() || null,
        whatsapp_number: form.whatsapp_number.trim() || null,
        preferred_contact: form.preferred_contact,
        preferred_language: form.preferred_language,
        source: form.source,
        source_detail: form.source_detail.trim() || null,
        vehicle_interest_id: form.vehicle_interest_id || null,
        vehicle_interest_text: form.vehicle_interest_text.trim() || null,
        assigned_to: form.assigned_to || null,
        notes: form.notes.trim() || null,
        status: 'new',
      };

      const { data, error: insertErr } = await supabase.from('leads').insert(leadData).select('id').single();
      if (insertErr) throw insertErr;

      await supabase.from('lead_activities').insert({
        lead_id: data.id, dealership_id: profile.dealership_id, user_id: profile.id,
        activity_type: 'system', body: `Lead created manually by ${profile.first_name} ${profile.last_name}`,
      });

      navigate(`/leads/${data.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  }

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const filteredVehicles = vehicles.filter(v => {
    if (!vehicleSearch) return true;
    const q = vehicleSearch.toLowerCase();
    return `${v.year} ${v.make} ${v.model} ${v.stock_number}`.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/leads')} className="text-brand-muted hover:text-white transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-3xl font-display font-bold text-white">New Lead</h1>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-gold text-brand-dark font-bold rounded-lg hover:bg-brand-gold-light transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Create Lead
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <User size={16} className="text-brand-gold" /> Customer Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name *" value={form.first_name} onChange={v => update('first_name', v)} placeholder="Pedro" />
              <Field label="Last Name" value={form.last_name} onChange={v => update('last_name', v)} placeholder="Henrique" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Field label="Phone" value={form.phone} onChange={v => update('phone', v)} placeholder="(201) 555-0101" type="tel" />
              <Field label="Email" value={form.email} onChange={v => update('email', v)} placeholder="pedro@email.com" type="email" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Field label="WhatsApp Number" value={form.whatsapp_number} onChange={v => update('whatsapp_number', v)} placeholder="+12015550101" />
              <Field label="Secondary Phone" value={form.phone_secondary} onChange={v => update('phone_secondary', v)} placeholder="(201) 555-0102" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <SelectField label="Preferred Contact" value={form.preferred_contact} onChange={v => update('preferred_contact', v)} options={CONTACT_PREFS} />
              <SelectField label="Language" value={form.preferred_language} onChange={v => update('preferred_language', v)} options={LANGUAGES} />
            </div>
          </div>

          {/* Vehicle Interest */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Car size={16} className="text-brand-gold" /> Vehicle Interest
            </h2>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Select from Inventory</label>
              <select value={form.vehicle_interest_id} onChange={e => update('vehicle_interest_id', e.target.value)}
                className="w-full bg-brand-darker border border-brand-border rounded-lg px-4 py-3 text-white text-sm focus:border-brand-gold/50 transition-colors appearance-none">
                <option value="">No specific vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} {v.trim || ''} - STK# {v.stock_number} - ${Number(v.asking_price).toLocaleString()}</option>)}
              </select>
            </div>
            <Field label="Or describe what they're looking for" value={form.vehicle_interest_text} onChange={v => update('vehicle_interest_text', v)} placeholder="Looking for an SUV under $25k, prefers AWD" />
          </div>

          {/* Notes */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-5">Notes</h2>
            <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={4}
              placeholder="Initial notes about this lead..."
              className="w-full bg-brand-darker border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-muted/50 focus:border-brand-gold/50 transition-colors resize-none" />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Source */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Tag size={16} className="text-brand-gold" /> Lead Source
            </h2>
            <SelectField label="Source" value={form.source} onChange={v => update('source', v)} options={SOURCES} />
            <div className="mt-4">
              <Field label="Source Detail" value={form.source_detail} onChange={v => update('source_detail', v)} placeholder="Facebook Ad name, referral name, etc." />
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-5">Assignment</h2>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Assign To</label>
            <select value={form.assigned_to} onChange={e => update('assigned_to', e.target.value)}
              className="w-full bg-brand-darker border border-brand-border rounded-lg px-4 py-3 text-white text-sm focus:border-brand-gold/50 transition-colors appearance-none">
              <option value="">Unassigned</option>
              {teamMembers.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.role})</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-brand-darker border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-muted/50 focus:border-brand-gold/50 transition-colors" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-brand-darker border border-brand-border rounded-lg px-4 py-3 text-white text-sm focus:border-brand-gold/50 transition-colors appearance-none">
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}
