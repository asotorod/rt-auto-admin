import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { isManagerOrAbove } from '../../lib/supabase';
import {
  ArrowLeft, Edit2, Trash2, Car, Gauge, Calendar, Hash, DollarSign,
  Palette, Fuel, Settings, Star, Loader2, ExternalLink, Copy, Check
} from 'lucide-react';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const canEdit = isManagerOrAbove(profile?.role);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetchVehicle(); }, [id]);

  async function fetchVehicle() {
    const { data } = await supabase
      .from('vehicles')
      .select('*, vehicle_photos(*)')
      .eq('id', id)
      .single();
    setVehicle(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this vehicle permanently?')) return;
    await supabase.from('vehicle_photos').delete().eq('vehicle_id', id);
    await supabase.from('vehicles').delete().eq('id', id);
    navigate('/inventory');
  }

  const copyVin = () => {
    navigator.clipboard.writeText(vehicle?.vin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-gold" /></div>;
  if (!vehicle) return <div className="text-center py-20 text-brand-muted">Vehicle not found</div>;

  const photos = (vehicle.vehicle_photos || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const primaryPhoto = photos.find(p => p.is_primary)?.url || photos[0]?.url;
  const age = vehicle.in_date ? Math.floor((Date.now() - new Date(vehicle.in_date).getTime()) / 86400000) : '—';
  const profit = vehicle.asking_price && vehicle.cost ? (vehicle.asking_price - vehicle.cost) : null;

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
              {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ''}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-brand-muted text-sm font-mono">STK# {vehicle.stock_number}</span>
              <button onClick={copyVin} className="flex items-center gap-1 text-brand-muted text-sm font-mono hover:text-brand-gold transition-colors">
                VIN: {vehicle.vin} {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Link to={`/inventory/${id}/edit`} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-dark font-bold text-sm rounded-lg hover:bg-brand-gold-light transition-colors">
              <Edit2 size={14} /> Edit
            </Link>
            <button onClick={handleDelete} className="inline-flex items-center gap-2 px-4 py-2 bg-danger/10 text-danger border border-danger/20 font-bold text-sm rounded-lg hover:bg-danger/20 transition-colors">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photos + details - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Primary photo */}
          <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
            <div className="aspect-[16/9] bg-brand-darker">
              {primaryPhoto ? (
                <img src={primaryPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Car size={48} className="text-brand-muted/20" /></div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-1 p-2 overflow-x-auto">
                {photos.map(p => (
                  <div key={p.id} className="w-20 h-14 rounded overflow-hidden bg-brand-darker flex-shrink-0">
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Specs grid */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Vehicle Specifications</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
              <Spec icon={<Calendar size={14} />} label="Year" value={vehicle.year} />
              <Spec icon={<Car size={14} />} label="Body Type" value={vehicle.body_type} />
              <Spec icon={<Gauge size={14} />} label="Mileage" value={vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : '—'} />
              <Spec icon={<Settings size={14} />} label="Engine" value={vehicle.engine || '—'} />
              <Spec icon={<Settings size={14} />} label="Transmission" value={vehicle.transmission || '—'} />
              <Spec icon={<Settings size={14} />} label="Drivetrain" value={vehicle.drivetrain || '—'} />
              <Spec icon={<Fuel size={14} />} label="Fuel Type" value={vehicle.fuel_type || '—'} />
              <Spec icon={<Palette size={14} />} label="Exterior" value={vehicle.exterior_color || '—'} />
              <Spec icon={<Palette size={14} />} label="Interior" value={vehicle.interior_color || '—'} />
            </div>
          </div>

          {/* Description */}
          {vehicle.description && (
            <div className="bg-brand-card border border-brand-border rounded-xl p-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Description</h2>
              <p className="text-brand-muted text-sm leading-relaxed whitespace-pre-line">{vehicle.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing card */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-white">${vehicle.asking_price?.toLocaleString() || '—'}</div>
              {vehicle.internet_price && vehicle.internet_price !== vehicle.asking_price && (
                <div className="text-sm text-brand-gold mt-1">Internet: ${vehicle.internet_price.toLocaleString()}</div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-t border-brand-border">
                <span className="text-brand-muted">Cost</span>
                <span className="text-white font-medium">${vehicle.cost?.toLocaleString() || '—'}</span>
              </div>
              {profit !== null && (
                <div className="flex justify-between py-2 border-t border-brand-border">
                  <span className="text-brand-muted">Potential Profit</span>
                  <span className={`font-bold ${profit > 0 ? 'text-success' : 'text-danger'}`}>${profit.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status card */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-brand-muted text-xs uppercase tracking-wider">Status</span>
              <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                vehicle.status === 'active' ? 'bg-success/10 text-success' :
                vehicle.status === 'sold' ? 'bg-brand-gold/10 text-brand-gold' :
                vehicle.status === 'pending_sale' ? 'bg-warning/10 text-warning' :
                'bg-brand-muted/10 text-brand-muted'
              }`}>{vehicle.status?.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-muted text-xs uppercase tracking-wider">Days on Lot</span>
              <span className="text-white font-bold">{age}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-muted text-xs uppercase tracking-wider">In Date</span>
              <span className="text-white text-sm">{vehicle.in_date || '—'}</span>
            </div>
            {vehicle.is_featured && (
              <div className="flex items-center gap-2 bg-brand-gold/10 text-brand-gold text-xs font-bold px-3 py-2 rounded-lg">
                <Star size={12} /> Featured Vehicle
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Spec({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-brand-gold mt-0.5">{icon}</div>
      <div>
        <div className="text-[10px] text-brand-muted uppercase tracking-wider">{label}</div>
        <div className="text-sm text-white capitalize">{value}</div>
      </div>
    </div>
  );
}
