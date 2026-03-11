import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import {
  ArrowLeft, Phone, Mail, MessageCircle, Clock, Calendar, User,
  Car, Edit3, Trash2, Plus, Send, AlertCircle, Loader2, MapPin,
  Globe, Tag, ChevronDown, CheckCircle2, XCircle, Star
} from 'lucide-react';

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  contacted: { label: 'Contacted', color: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  engaged: { label: 'Engaged', color: 'bg-purple-500', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  qualified: { label: 'Qualified', color: 'bg-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  appointment_set: { label: 'Appointment Set', color: 'bg-brand-gold', text: 'text-brand-gold', bg: 'bg-brand-gold/10' },
  showed: { label: 'Showed', color: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  negotiating: { label: 'Negotiating', color: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  sold: { label: 'Sold', color: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10' },
  lost: { label: 'Lost', color: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
  dead: { label: 'Dead', color: 'bg-gray-500', text: 'text-gray-400', bg: 'bg-gray-500/10' },
};

const SOURCE_ICONS = {
  facebook: '📘', instagram: '📸', whatsapp: '💬', cargurus: '🚗',
  autotrader: '🏷️', cars_com: '🔍', carfax: '📋', website: '🌐',
  walk_in: '🚶', phone: '📞', referral: '🤝', craigslist: '📝',
  repeat: '🔄', other: '📌',
};

const ACTIVITY_ICONS = {
  system: Globe, note: Edit3, call: Phone, email: Mail,
  sms: MessageCircle, whatsapp: MessageCircle, status_change: CheckCircle2,
  assignment: User, appointment: Calendar,
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id && profile) { fetchLead(); fetchActivities(); fetchTeam(); }
  }, [id, profile]);

  async function fetchLead() {
    try {
      const { data, error: err } = await supabase
        .from('leads')
        .select(`*, assigned_user:user_profiles!leads_assigned_to_fkey(id, first_name, last_name, role), vehicle:vehicles!leads_vehicle_interest_id_fkey(id, year, make, model, trim, asking_price, stock_number, vehicle_photos(url))`)
        .eq('id', id)
        .single();
      if (err) throw err;
      setLead(data);
    } catch (err) {
      setError('Lead not found');
    } finally {
      setLoading(false);
    }
  }

  async function fetchActivities() {
    const { data } = await supabase
      .from('lead_activities')
      .select('*, user:user_profiles!lead_activities_user_id_fkey(first_name, last_name)')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });
    setActivities(data || []);
  }

  async function fetchTeam() {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, role')
      .eq('dealership_id', profile.dealership_id)
      .order('first_name');
    setTeamMembers(data || []);
  }

  async function handleStatusChange(newStatus) {
    setUpdatingStatus(true);
    setShowStatusMenu(false);
    try {
      const oldStatus = lead.status;
      const updates = { status: newStatus, updated_at: new Date().toISOString() };
      if (['sold', 'lost', 'dead'].includes(newStatus)) updates.closed_at = new Date().toISOString();
      
      const { error: err } = await supabase.from('leads').update(updates).eq('id', id);
      if (err) throw err;

      await supabase.from('lead_activities').insert({
        lead_id: id,
        dealership_id: profile.dealership_id,
        user_id: profile.id,
        activity_type: 'status_change',
        body: `Status changed from ${STATUS_CONFIG[oldStatus]?.label} to ${STATUS_CONFIG[newStatus]?.label}`,
        old_value: oldStatus,
        new_value: newStatus,
      });

      fetchLead();
      fetchActivities();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAssign(userId) {
    try {
      const { error: err } = await supabase.from('leads').update({ assigned_to: userId || null }).eq('id', id);
      if (err) throw err;
      const member = teamMembers.find(m => m.id === userId);
      await supabase.from('lead_activities').insert({
        lead_id: id, dealership_id: profile.dealership_id, user_id: profile.id,
        activity_type: 'assignment',
        body: userId ? `Assigned to ${member?.first_name} ${member?.last_name}` : 'Unassigned',
      });
      fetchLead();
      fetchActivities();
    } catch (err) { setError(err.message); }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      await supabase.from('lead_activities').insert({
        lead_id: id, dealership_id: profile.dealership_id, user_id: profile.id,
        activity_type: 'note', body: newNote.trim(),
      });
      await supabase.from('leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', id);
      setNewNote('');
      fetchActivities();
      fetchLead();
    } catch (err) { setError(err.message); }
    finally { setSavingNote(false); }
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-gold" /></div>;
  if (error || !lead) return (
    <div className="text-center py-16"><AlertCircle size={32} className="mx-auto mb-3 text-danger" />
      <p className="text-white text-lg">{error || 'Lead not found'}</p>
      <button onClick={() => navigate('/leads')} className="mt-4 text-brand-gold hover:underline">Back to Leads</button>
    </div>
  );

  const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/leads')} className="text-brand-muted hover:text-white transition-colors"><ArrowLeft size={22} /></button>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">{lead.first_name} {lead.last_name || ''}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm">{SOURCE_ICONS[lead.source] || '📌'}</span>
              <span className="text-brand-muted text-sm capitalize">{lead.source?.replace('_', ' ')}</span>
              {lead.source_detail && <span className="text-brand-muted/60 text-sm">&bull; {lead.source_detail}</span>}
              <span className="text-brand-muted/60 text-sm">&bull; {timeAgo(lead.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Dropdown */}
          <div className="relative">
            <button onClick={() => setShowStatusMenu(!showStatusMenu)} disabled={updatingStatus}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold ${sc.bg} ${sc.text} border border-current/20 hover:opacity-90 transition-all`}>
              {updatingStatus ? <Loader2 size={14} className="animate-spin" /> : <span className={`w-2 h-2 rounded-full ${sc.color}`} />}
              {sc.label} <ChevronDown size={14} />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-brand-card border border-brand-border rounded-xl shadow-2xl z-50 py-1 max-h-80 overflow-y-auto">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => handleStatusChange(key)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-sidebar-hover transition-colors ${lead.status === key ? 'text-white font-semibold' : 'text-brand-muted'}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.color}`} />{cfg.label}
                    {lead.status === key && <CheckCircle2 size={14} className="ml-auto text-brand-gold" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-card border border-brand-border rounded-lg text-sm text-brand-muted hover:text-white hover:border-brand-gold/30 transition-all">
                <Phone size={15} /> Call
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-card border border-brand-border rounded-lg text-sm text-brand-muted hover:text-white hover:border-brand-gold/30 transition-all">
                <Mail size={15} /> Email
              </a>
            )}
            {lead.whatsapp_number && (
              <a href={`https://wa.me/${lead.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400 hover:bg-green-500/20 transition-all">
                <MessageCircle size={15} /> WhatsApp
              </a>
            )}
            {lead.phone && (
              <a href={`sms:${lead.phone}`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-card border border-brand-border rounded-lg text-sm text-brand-muted hover:text-white hover:border-brand-gold/30 transition-all">
                <MessageCircle size={15} /> SMS
              </a>
            )}
          </div>

          {/* Add Note */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Add Note</h3>
            <div className="flex gap-3">
              <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={2}
                placeholder="Type a note, log a call, or record an interaction..."
                className="flex-1 bg-brand-darker border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-muted/50 focus:border-brand-gold/50 transition-colors resize-none"
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAddNote(); }}
              />
              <button onClick={handleAddNote} disabled={savingNote || !newNote.trim()}
                className="self-end inline-flex items-center gap-2 px-5 py-3 bg-brand-gold text-brand-dark font-bold rounded-lg hover:bg-brand-gold-light transition-colors disabled:opacity-40">
                {savingNote ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Add
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Activity Timeline</h3>
            {activities.length === 0 ? (
              <p className="text-brand-muted text-sm py-4 text-center">No activity yet</p>
            ) : (
              <div className="space-y-0">
                {activities.map((act, i) => {
                  const Icon = ACTIVITY_ICONS[act.activity_type] || Globe;
                  const isStatusChange = act.activity_type === 'status_change';
                  const isNote = act.activity_type === 'note';
                  return (
                    <div key={act.id} className="flex gap-3 group">
                      {/* Timeline line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isStatusChange ? 'bg-brand-gold/15' : isNote ? 'bg-blue-500/15' : 'bg-brand-card border border-brand-border'
                        }`}>
                          <Icon size={14} className={isStatusChange ? 'text-brand-gold' : isNote ? 'text-blue-400' : 'text-brand-muted'} />
                        </div>
                        {i < activities.length - 1 && <div className="w-px flex-1 bg-brand-border my-1" />}
                      </div>
                      {/* Content */}
                      <div className="pb-5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">{act.body || act.subject || act.activity_type}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {act.user && <span className="text-xs text-brand-muted">{act.user.first_name} {act.user.last_name}</span>}
                          <span className="text-xs text-brand-muted/60">{timeAgo(act.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact Info</h3>
            <div className="space-y-3">
              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={15} className="text-brand-muted flex-shrink-0" />
                  <div><div className="text-xs text-brand-muted">Phone</div><div className="text-sm text-white">{lead.phone}</div></div>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail size={15} className="text-brand-muted flex-shrink-0" />
                  <div><div className="text-xs text-brand-muted">Email</div><div className="text-sm text-white truncate">{lead.email}</div></div>
                </div>
              )}
              {lead.whatsapp_number && (
                <div className="flex items-center gap-3">
                  <MessageCircle size={15} className="text-green-400 flex-shrink-0" />
                  <div><div className="text-xs text-brand-muted">WhatsApp</div><div className="text-sm text-white">{lead.whatsapp_number}</div></div>
                </div>
              )}
              {lead.preferred_language && (
                <div className="flex items-center gap-3">
                  <Globe size={15} className="text-brand-muted flex-shrink-0" />
                  <div><div className="text-xs text-brand-muted">Language</div><div className="text-sm text-white">{lead.preferred_language === 'pt' ? 'Portuguese' : lead.preferred_language === 'es' ? 'Spanish' : 'English'}</div></div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Interest */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2"><Car size={15} className="text-brand-gold" /> Vehicle Interest</h3>
            {lead.vehicle ? (
              <Link to={`/inventory/${lead.vehicle.id}`} className="block group">
                {lead.vehicle.vehicle_photos?.[0]?.url && (
                  <div className="rounded-lg overflow-hidden mb-3 aspect-video bg-brand-darker">
                    <img src={lead.vehicle.vehicle_photos[0].url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                )}
                <div className="text-white font-medium group-hover:text-brand-gold transition-colors">{lead.vehicle.year} {lead.vehicle.make} {lead.vehicle.model} {lead.vehicle.trim || ''}</div>
                <div className="text-sm text-brand-muted">STK# {lead.vehicle.stock_number}</div>
                {lead.vehicle.asking_price && <div className="text-lg font-bold text-brand-gold mt-1">${Number(lead.vehicle.asking_price).toLocaleString()}</div>}
              </Link>
            ) : lead.vehicle_interest_text ? (
              <p className="text-sm text-brand-muted">{lead.vehicle_interest_text}</p>
            ) : (
              <p className="text-sm text-brand-muted/40">No vehicle specified</p>
            )}
          </div>

          {/* Assignment */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Assigned To</h3>
            <select value={lead.assigned_to || ''} onChange={e => handleAssign(e.target.value || null)}
              className="w-full bg-brand-darker border border-brand-border rounded-lg px-4 py-3 text-white text-sm focus:border-brand-gold/50 transition-colors appearance-none">
              <option value="">Unassigned</option>
              {teamMembers.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.role})</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-brand-muted">Created</span><span className="text-white">{new Date(lead.created_at).toLocaleDateString()}</span></div>
              {lead.last_contacted_at && <div className="flex justify-between"><span className="text-brand-muted">Last Contact</span><span className="text-white">{timeAgo(lead.last_contacted_at)}</span></div>}
              {lead.appointment_at && <div className="flex justify-between"><span className="text-brand-muted">Appointment</span><span className="text-brand-gold">{new Date(lead.appointment_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></div>}
              {lead.closed_at && <div className="flex justify-between"><span className="text-brand-muted">Closed</span><span className="text-white">{new Date(lead.closed_at).toLocaleDateString()}</span></div>}
              {lead.lost_reason && <div className="flex justify-between"><span className="text-brand-muted">Lost Reason</span><span className="text-red-400">{lead.lost_reason}</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
