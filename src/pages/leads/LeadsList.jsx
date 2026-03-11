import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import {
  Users, Plus, Search, Phone, Mail, MessageCircle,
  Clock, Calendar, AlertCircle, Loader2, Car, X, RefreshCw, ArrowUpDown
} from 'lucide-react';

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  contacted: { label: 'Contacted', color: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  engaged: { label: 'Engaged', color: 'bg-purple-500', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  qualified: { label: 'Qualified', color: 'bg-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  appointment_set: { label: 'Appointment', color: 'bg-brand-gold', text: 'text-brand-gold', bg: 'bg-brand-gold/10' },
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

export default function LeadsList() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    if (profile?.dealership_id) { fetchLeads(); fetchTeam(); }
  }, [profile, statusFilter, sourceFilter, assignedFilter, sortBy, sortDir]);

  async function fetchLeads() {
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select(`*, assigned_user:user_profiles!leads_assigned_to_fkey(id, first_name, last_name), vehicle:vehicles!leads_vehicle_interest_id_fkey(id, year, make, model, asking_price)`)
        .eq('dealership_id', profile.dealership_id)
        .order(sortBy, { ascending: sortDir === 'asc' });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (sourceFilter !== 'all') query = query.eq('source', sourceFilter);
      if (assignedFilter === 'unassigned') query = query.is('assigned_to', null);
      else if (assignedFilter === 'mine') query = query.eq('assigned_to', profile.id);
      else if (assignedFilter !== 'all') query = query.eq('assigned_to', assignedFilter);

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      setLeads(data || []);

      const { data: allLeads } = await supabase.from('leads').select('status').eq('dealership_id', profile.dealership_id);
      const counts = {};
      (allLeads || []).forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });
      setStats(counts);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function fetchTeam() {
    const { data } = await supabase.from('user_profiles').select('id, first_name, last_name, role').eq('dealership_id', profile.dealership_id).order('first_name');
    setTeamMembers(data || []);
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

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (lead.first_name || '').toLowerCase().includes(q) || (lead.last_name || '').toLowerCase().includes(q) || (lead.email || '').toLowerCase().includes(q) || (lead.phone || '').includes(q) || (lead.vehicle_interest_text || '').toLowerCase().includes(q);
  });

  const totalLeads = Object.values(stats).reduce((a, b) => a + b, 0);
  const activeLeads = totalLeads - (stats.sold || 0) - (stats.lost || 0) - (stats.dead || 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Leads</h1>
          <p className="text-brand-muted text-sm mt-1">{totalLeads} total leads &bull; {activeLeads} active</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchLeads} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-card border border-brand-border rounded-lg text-brand-muted hover:text-white transition-colors"><RefreshCw size={16} /></button>
          <button onClick={() => navigate('/leads/new')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-gold text-brand-dark font-bold rounded-lg hover:bg-brand-gold-light transition-colors"><Plus size={16} /> New Lead</button>
        </div>
      </div>

      {/* Status Pipeline Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setStatusFilter('all')} className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'all' ? 'bg-white/10 text-white border border-white/20' : 'bg-brand-card border border-brand-border text-brand-muted hover:text-white'}`}>All ({totalLeads})</button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = stats[key] || 0;
          if (count === 0 && !['new', 'contacted', 'appointment_set', 'negotiating'].includes(key)) return null;
          return (
            <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${statusFilter === key ? `${cfg.bg} ${cfg.text} border border-current/20` : 'bg-brand-card border border-brand-border text-brand-muted hover:text-white'}`}>
              <span className={`w-2 h-2 rounded-full ${cfg.color}`} />{cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, phone, email, vehicle..." className="w-full bg-brand-darker border border-brand-border rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-brand-muted/50 focus:border-brand-gold/50 transition-colors" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white"><X size={14} /></button>}
          </div>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="bg-brand-darker border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm appearance-none min-w-[140px]">
            <option value="all">All Sources</option>
            <option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="whatsapp">WhatsApp</option>
            <option value="cargurus">CarGurus</option><option value="autotrader">AutoTrader</option><option value="cars_com">Cars.com</option>
            <option value="carfax">Carfax</option><option value="website">Website</option><option value="walk_in">Walk-in</option>
            <option value="phone">Phone</option><option value="referral">Referral</option>
          </select>
          <select value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)} className="bg-brand-darker border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm appearance-none min-w-[140px]">
            <option value="all">All Assigned</option><option value="mine">My Leads</option><option value="unassigned">Unassigned</option>
            {teamMembers.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg"><AlertCircle size={16} /> {error}</div>}

      {/* Leads Table */}
      <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-brand-gold" /></div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-16 text-brand-muted">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">No leads found</p>
            <p className="text-sm mt-1">{searchQuery || statusFilter !== 'all' || sourceFilter !== 'all' ? 'Try adjusting your filters' : 'New leads will appear here as they come in'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-brand-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-brand-muted uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-brand-muted uppercase tracking-wider hidden lg:table-cell">Vehicle Interest</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-brand-muted uppercase tracking-wider hidden md:table-cell">Source</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-brand-muted uppercase tracking-wider hidden xl:table-cell">Assigned</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-brand-muted uppercase tracking-wider">
                    <button onClick={() => { if (sortBy === 'created_at') setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortBy('created_at'); setSortDir('desc'); } }} className="inline-flex items-center gap-1 hover:text-white transition-colors">Age <ArrowUpDown size={12} /></button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredLeads.map(lead => {
                  const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                  return (
                    <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="hover:bg-sidebar-hover transition-colors cursor-pointer group">
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.color}`} />{sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-gold/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-brand-gold text-xs font-bold">{(lead.first_name?.[0] || '').toUpperCase()}{(lead.last_name?.[0] || '').toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-white font-medium truncate group-hover:text-brand-gold transition-colors">{lead.first_name} {lead.last_name || ''}</div>
                            <div className="flex items-center gap-2 text-xs text-brand-muted mt-0.5">
                              {lead.phone && <span className="flex items-center gap-1"><Phone size={10} /> {lead.phone}</span>}
                              {lead.whatsapp_number && <span className="flex items-center gap-1 text-green-400"><MessageCircle size={10} /> WA</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div className="text-sm text-white truncate max-w-[200px]">
                          {lead.vehicle?.year ? <span className="flex items-center gap-1.5"><Car size={13} className="text-brand-muted flex-shrink-0" />{lead.vehicle.year} {lead.vehicle.make} {lead.vehicle.model}</span> : lead.vehicle_interest_text ? <span className="text-brand-muted">{lead.vehicle_interest_text}</span> : <span className="text-brand-muted/40">&mdash;</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5"><span className="text-sm">{SOURCE_ICONS[lead.source] || '📌'}</span><span className="text-xs text-brand-muted capitalize">{lead.source?.replace('_', ' ')}</span></div>
                        {lead.source_detail && <div className="text-[11px] text-brand-muted/60 mt-0.5 truncate max-w-[160px]">{lead.source_detail}</div>}
                      </td>
                      <td className="px-5 py-3.5 hidden xl:table-cell">
                        {lead.assigned_user ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-brand-gold/20 flex items-center justify-center"><span className="text-brand-gold text-[9px] font-bold">{lead.assigned_user.first_name?.[0]}{lead.assigned_user.last_name?.[0]}</span></div>
                            <span className="text-xs text-brand-muted">{lead.assigned_user.first_name}</span>
                          </div>
                        ) : <span className="text-xs text-brand-muted/40">Unassigned</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="text-xs text-brand-muted flex items-center gap-1 justify-end"><Clock size={11} />{timeAgo(lead.created_at)}</div>
                        {lead.status === 'new' && <div className="text-[10px] text-blue-400 font-medium mt-0.5">Needs response</div>}
                        {lead.appointment_at && new Date(lead.appointment_at) > new Date() && (
                          <div className="text-[10px] text-brand-gold font-medium mt-0.5 flex items-center gap-1 justify-end"><Calendar size={9} />Appt {new Date(lead.appointment_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredLeads.length > 0 && (
          <div className="px-5 py-3 border-t border-brand-border flex items-center justify-between">
            <span className="text-xs text-brand-muted">Showing {filteredLeads.length} of {totalLeads} leads</span>
          </div>
        )}
      </div>
    </div>
  );
}
