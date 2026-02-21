import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import {
  Save, ArrowLeft, Loader2, Search, AlertCircle, Car,
  ImagePlus, Trash2, Star, Hash, DollarSign, Gauge, Palette
} from 'lucide-react';

const BODY_TYPES = ['sedan', 'suv', 'truck', 'coupe', 'convertible', 'wagon', 'van', 'hatchback', 'crossover', 'other'];
const FUEL_TYPES = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'Flex Fuel'];
const STATUSES = ['active', 'inactive', 'sold', 'pending_sale', 'in_transit', 'wholesale'];

export default function InventoryForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    vin: '', stock_number: '', year: '', make: '', model: '', trim: '',
    body_type: 'sedan', engine: '', transmission: '', drivetrain: '', fuel_type: '',
    exterior_color: '', interior_color: '', mileage: '', miles_exempt: false,
    door_count: '', seating_capacity: '',
    asking_price: '', internet_price: '', cost: '',
    status: 'active', is_featured: false,
    description: '', tagline: '',
    decode_string: '',
  });

  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (id) fetchVehicle();
  }, [id]);

  async function fetchVehicle() {
    try {
      const { data, error: fetchErr } = await supabase
        .from('vehicles')
        .select('*, vehicle_photos(*)')
        .eq('id', id)
        .single();

      if (fetchErr) throw fetchErr;

      setForm({
        vin: data.vin || '',
        stock_number: data.stock_number || '',
        year: data.year || '',
        make: data.make || '',
        model: data.model || '',
        trim: data.trim || '',
        body_type: data.body_type || 'sedan',
        engine: data.engine || '',
        transmission: data.transmission || '',
        drivetrain: data.drivetrain || '',
        fuel_type: data.fuel_type || '',
        exterior_color: data.exterior_color || '',
        interior_color: data.interior_color || '',
        mileage: data.mileage || '',
        miles_exempt: data.miles_exempt || false,
        door_count: data.door_count || '',
        seating_capacity: data.seating_capacity || '',
        asking_price: data.asking_price || '',
        internet_price: data.internet_price || '',
        cost: data.cost || '',
        status: data.status || 'active',
        is_featured: data.is_featured || false,
        description: data.description || '',
        tagline: data.tagline || '',
        decode_string: data.decode_string || '',
      });

      setPhotos(data.vehicle_photos?.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) || []);
    } catch (err) {
      setError('Vehicle not found');
    } finally {
      setLoading(false);
    }
  }

  async function handleVinDecode() {
    if (!form.vin || form.vin.length !== 17) {
      setError('VIN must be 17 characters');
      return;
    }
    setDecoding(true);
    setError('');
    try {
      // Use NHTSA free VIN decode API
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${form.vin}?format=json`);
      const data = await res.json();
      const results = data.Results || [];

      const get = (varId) => {
        const item = results.find(r => r.VariableId === varId);
        return item?.Value && item.Value !== 'Not Applicable' ? item.Value : '';
      };

      setForm(prev => ({
        ...prev,
        year: get(29) || prev.year,
        make: get(26) || prev.make,
        model: get(28) || prev.model,
        trim: get(38) || prev.trim,
        body_type: mapBodyType(get(5)) || prev.body_type,
        engine: [get(13), get(18) ? `${get(18)}L` : '', get(21)].filter(Boolean).join(' ') || prev.engine,
        transmission: get(37) || prev.transmission,
        drivetrain: get(15) || prev.drivetrain,
        fuel_type: get(24) || prev.fuel_type,
        door_count: get(14) || prev.door_count,
        seating_capacity: get(33) || prev.seating_capacity,
      }));
    } catch (err) {
      setError('VIN decode failed. Check the VIN and try again.');
    } finally {
      setDecoding(false);
    }
  }

  function mapBodyType(nhtsaType) {
    if (!nhtsaType) return '';
    const t = nhtsaType.toLowerCase();
    if (t.includes('sedan')) return 'sedan';
    if (t.includes('suv') || t.includes('sport utility')) return 'suv';
    if (t.includes('truck') || t.includes('pickup')) return 'truck';
    if (t.includes('coupe')) return 'coupe';
    if (t.includes('convertible')) return 'convertible';
    if (t.includes('wagon')) return 'wagon';
    if (t.includes('van')) return 'van';
    if (t.includes('hatchback')) return 'hatchback';
    return 'other';
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const vehicleData = {
        dealership_id: profile.dealership_id,
        vin: form.vin.toUpperCase(),
        stock_number: form.stock_number,
        year: parseInt(form.year),
        make: form.make,
        model: form.model,
        trim: form.trim || null,
        body_type: form.body_type,
        engine: form.engine || null,
        transmission: form.transmission || null,
        drivetrain: form.drivetrain || null,
        fuel_type: form.fuel_type || null,
        exterior_color: form.exterior_color || null,
        interior_color: form.interior_color || null,
        mileage: parseInt(form.mileage) || 0,
        miles_exempt: form.miles_exempt,
        door_count: parseInt(form.door_count) || null,
        seating_capacity: parseInt(form.seating_capacity) || null,
        asking_price: parseFloat(form.asking_price) || 0,
        internet_price: parseFloat(form.internet_price) || null,
        cost: parseFloat(form.cost) || 0,
        status: form.status,
        is_featured: form.is_featured,
        description: form.description || null,
        tagline: form.tagline || null,
        decode_string: form.decode_string || null,
        slug: `${form.year}-${form.make}-${form.model}-${form.vin?.slice(-8)}`.toLowerCase().replace(/\s+/g, '-'),
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        const { data, error: insertErr } = await supabase
          .from('vehicles')
          .insert(vehicleData)
          .select('id')
          .single();
        if (insertErr) throw insertErr;
        navigate(`/inventory/${data.id}`);
      } else {
        const { error: updateErr } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', id);
        if (updateErr) throw updateErr;
        navigate(`/inventory/${id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  }

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-brand-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/inventory')} className="text-brand-muted hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              {isNew ? 'New Vehicle' : `Edit: ${form.year} ${form.make} ${form.model}`}
            </h1>
            {!isNew && <p className="text-brand-muted text-sm">VIN: {form.vin}</p>}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !form.vin || !form.make || !form.model}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-gold text-brand-dark font-bold text-sm rounded-lg hover:bg-brand-gold-light transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isNew ? 'Create Vehicle' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded-lg">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* VIN Decode Section */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Hash size={14} className="text-brand-gold" /> VIN Decode
        </h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={form.vin}
              onChange={e => updateField('vin', e.target.value.toUpperCase().slice(0, 17))}
              placeholder="Enter 17-digit VIN"
              maxLength={17}
              className="w-full bg-brand-darker border border-brand-border rounded-lg px-4 py-3 text-white font-mono text-sm placeholder:text-brand-muted/40 focus:border-brand-gold/50 transition-colors uppercase tracking-wider"
            />
            <div className="text-xs text-brand-muted mt-1">{form.vin.length}/17 characters</div>
          </div>
          <button
            onClick={handleVinDecode}
            disabled={decoding || form.vin.length !== 17}
            className="inline-flex items-center gap-2 px-5 py-3 bg-info/10 text-info border border-info/20 font-bold text-sm rounded-lg hover:bg-info/20 transition-colors disabled:opacity-40 h-fit"
          >
            {decoding ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Decode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Info */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Car size={14} className="text-brand-gold" /> Vehicle Information
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Year" value={form.year} onChange={v => updateField('year', v)} placeholder="2024" />
              <Field label="Make" value={form.make} onChange={v => updateField('make', v)} placeholder="BMW" />
              <Field label="Model" value={form.model} onChange={v => updateField('model', v)} placeholder="X5" />
              <Field label="Trim" value={form.trim} onChange={v => updateField('trim', v)} placeholder="xDrive40i" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              <SelectField label="Body Type" value={form.body_type} onChange={v => updateField('body_type', v)} options={BODY_TYPES} />
              <Field label="Engine" value={form.engine} onChange={v => updateField('engine', v)} placeholder="3.0L I6 Turbo" />
              <Field label="Transmission" value={form.transmission} onChange={v => updateField('transmission', v)} placeholder="8-Speed Auto" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              <Field label="Drivetrain" value={form.drivetrain} onChange={v => updateField('drivetrain', v)} placeholder="AWD" />
              <SelectField label="Fuel Type" value={form.fuel_type} onChange={v => updateField('fuel_type', v)} options={FUEL_TYPES} />
              <Field label="Doors" value={form.door_count} onChange={v => updateField('door_count', v)} placeholder="4" type="number" />
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Palette size={14} className="text-brand-gold" /> Appearance & Condition
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Exterior Color" value={form.exterior_color} onChange={v => updateField('exterior_color', v)} placeholder="Black" />
              <Field label="Interior Color" value={form.interior_color} onChange={v => updateField('interior_color', v)} placeholder="Cognac" />
              <div>
                <Field label="Mileage" value={form.mileage} onChange={v => updateField('mileage', v)} placeholder="32,000" type="number" icon={<Gauge size={14} />} />
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" checked={form.miles_exempt} onChange={e => updateField('miles_exempt', e.target.checked)} className="accent-brand-gold" />
                  <span className="text-xs text-brand-muted">Miles Exempt</span>
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Description</h2>
            <Field label="Tagline" value={form.tagline} onChange={v => updateField('tagline', v)} placeholder="Luxury meets performance" />
            <textarea
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              rows={4}
              placeholder="Vehicle description..."
              className="mt-4 w-full bg-brand-darker border border-brand-border rounded-lg px-4 py-3 text-white text-sm placeholder:text-brand-muted/40 focus:border-brand-gold/50 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign size={14} className="text-brand-gold" /> Pricing
            </h2>
            <div className="space-y-4">
              <Field label="Asking Price" value={form.asking_price} onChange={v => updateField('asking_price', v)} placeholder="29,995" type="number" icon={<DollarSign size={14} />} />
              <Field label="Internet Price" value={form.internet_price} onChange={v => updateField('internet_price', v)} placeholder="28,995" type="number" icon={<DollarSign size={14} />} />
              <Field label="Cost" value={form.cost} onChange={v => updateField('cost', v)} placeholder="22,000" type="number" icon={<DollarSign size={14} />} />
            </div>
          </div>

          {/* Status */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Status & Details</h2>
            <div className="space-y-4">
              <SelectField label="Status" value={form.status} onChange={v => updateField('status', v)} options={STATUSES} />
              <Field label="Stock Number" value={form.stock_number} onChange={v => updateField('stock_number', v)} placeholder="RT5031T" />
              <label className="flex items-center gap-3 p-3 bg-brand-darker rounded-lg border border-brand-border cursor-pointer hover:border-brand-gold/30 transition-colors">
                <input type="checkbox" checked={form.is_featured} onChange={e => updateField('is_featured', e.target.checked)} className="accent-brand-gold" />
                <div>
                  <div className="text-sm text-white font-medium flex items-center gap-1"><Star size={12} className="text-brand-gold" /> Featured Vehicle</div>
                  <div className="text-[10px] text-brand-muted">Show on homepage</div>
                </div>
              </label>
            </div>
          </div>

          {/* Photos (count only for now) */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <ImagePlus size={14} className="text-brand-gold" /> Photos
            </h2>
            {photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.slice(0, 6).map((p, i) => (
                  <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-brand-darker">
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {photos.length > 6 && (
                  <div className="aspect-square rounded-lg bg-brand-darker flex items-center justify-center text-brand-muted text-xs">
                    +{photos.length - 6} more
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-brand-muted text-sm">
                <ImagePlus size={24} className="mx-auto mb-2 opacity-40" />
                Photo upload coming soon
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable field components
function Field({ label, value, onChange, placeholder, type = 'text', icon }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-brand-muted uppercase tracking-wider mb-1">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-brand-darker border border-brand-border rounded-lg py-2.5 text-white text-sm placeholder:text-brand-muted/40 focus:border-brand-gold/50 transition-colors ${icon ? 'pl-9 pr-4' : 'px-4'}`}
        />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-brand-muted uppercase tracking-wider mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-brand-darker border border-brand-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-brand-gold/50 transition-colors appearance-none"
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace('_', ' ')}</option>
        ))}
      </select>
    </div>
  );
}
