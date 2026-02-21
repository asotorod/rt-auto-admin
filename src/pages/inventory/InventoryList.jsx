import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { isManagerOrAbove } from '../../lib/supabase';
import {
  Car, Plus, Search, Filter, Loader2, Eye, Edit2, Trash2,
  ChevronLeft, ChevronRight, ArrowUpDown, Grid3X3, List
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'sold', label: 'Sold' },
  { key: 'pending_sale', label: 'Pending' },
];

const PAGE_SIZE = 25;

export default function InventoryList() {
  const { profile } = useAuth();
  const canEdit = isManagerOrAbove(profile?.role);

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    fetchVehicles();
  }, [profile, statusFilter, sortBy, sortAsc, page]);

  async function fetchVehicles() {
    if (!profile?.dealership_id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('vehicles')
        .select('id, vin, stock_number, year, make, model, trim, asking_price, internet_price, status, mileage, exterior_color, in_date, is_featured, body_type, vehicle_photos(url, is_primary, sort_order)', { count: 'exact' })
        .eq('dealership_id', profile.dealership_id);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      query = query.order(sortBy, { ascending: sortAsc }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const { data, count, error } = await query;
      if (error) throw error;

      setVehicles(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return vehicles;
    const q = searchQuery.toLowerCase();
    return vehicles.filter(v =>
      `${v.year} ${v.make} ${v.model} ${v.trim || ''} ${v.stock_number} ${v.vin}`.toLowerCase().includes(q)
    );
  }, [vehicles, searchQuery]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSort = (col) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(true); }
  };

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (!error) fetchVehicles();
  }

  const getPhoto = (v) => {
    const photos = v.vehicle_photos || [];
    const primary = photos.find(p => p.is_primary);
    const sorted = [...photos].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return primary?.url || sorted[0]?.url || null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Inventory</h1>
          <p className="text-brand-muted text-sm">{totalCount} vehicles total</p>
        </div>
        {canEdit && (
          <Link
            to="/inventory/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-brand-dark font-bold text-sm rounded-lg hover:bg-brand-gold-light transition-colors"
          >
            <Plus size={16} /> Add Vehicle
          </Link>
        )}
      </div>

      {/* Filters bar */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-4 space-y-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(0); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.key
                  ? 'bg-brand-gold/10 text-brand-gold'
                  : 'text-brand-muted hover:text-white hover:bg-sidebar-hover'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + view toggle */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-brand-darker border border-brand-border rounded-lg px-3 py-2">
            <Search size={14} className="text-brand-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by year, make, model, VIN, stock..."
              className="bg-transparent border-none text-sm text-white placeholder:text-brand-muted/40 w-full focus:outline-none"
            />
          </div>
          <div className="flex items-center border border-brand-border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('table')} className={`p-2 ${viewMode === 'table' ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-muted hover:text-white'}`}>
              <List size={16} />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-muted hover:text-white'}`}>
              <Grid3X3 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-brand-gold" />
        </div>
      ) : viewMode === 'table' ? (
        /* Table view */
        <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-brand-muted text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left w-14"></th>
                  <th className="px-4 py-3 text-left cursor-pointer hover:text-white" onClick={() => handleSort('stock_number')}>
                    <span className="flex items-center gap-1">STK# <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left cursor-pointer hover:text-white" onClick={() => handleSort('asking_price')}>
                    <span className="flex items-center gap-1">Price <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="px-4 py-3 text-left cursor-pointer hover:text-white" onClick={() => handleSort('mileage')}>
                    <span className="flex items-center gap-1">Miles <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left cursor-pointer hover:text-white" onClick={() => handleSort('in_date')}>
                    <span className="flex items-center gap-1">Age <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filtered.map(v => {
                  const photo = getPhoto(v);
                  const age = v.in_date ? Math.floor((Date.now() - new Date(v.in_date).getTime()) / 86400000) : '—';
                  return (
                    <tr key={v.id} className="hover:bg-sidebar-hover/50 transition-colors">
                      <td className="px-4 py-2">
                        <div className="w-14 h-10 rounded overflow-hidden bg-brand-darker">
                          {photo ? (
                            <img src={photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Car size={14} className="text-brand-muted/30" /></div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-brand-muted font-mono text-xs">{v.stock_number}</td>
                      <td className="px-4 py-2">
                        <div className="text-white font-medium">{v.year} {v.make} {v.model}</div>
                        <div className="text-brand-muted text-xs">{v.trim || ''} {v.exterior_color ? `• ${v.exterior_color}` : ''}</div>
                      </td>
                      <td className="px-4 py-2 text-white font-bold">${v.asking_price?.toLocaleString() || '—'}</td>
                      <td className="px-4 py-2 text-brand-muted">{v.mileage?.toLocaleString() || '—'}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          v.status === 'active' ? 'bg-success/10 text-success' :
                          v.status === 'sold' ? 'bg-brand-gold/10 text-brand-gold' :
                          v.status === 'pending_sale' ? 'bg-warning/10 text-warning' :
                          'bg-brand-muted/10 text-brand-muted'
                        }`}>
                          {v.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-brand-muted">{age}d</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/inventory/${v.id}`} className="p-1.5 text-brand-muted hover:text-white transition-colors" title="View">
                            <Eye size={14} />
                          </Link>
                          {canEdit && (
                            <>
                              <Link to={`/inventory/${v.id}/edit`} className="p-1.5 text-brand-muted hover:text-brand-gold transition-colors" title="Edit">
                                <Edit2 size={14} />
                              </Link>
                              <button onClick={() => handleDelete(v.id)} className="p-1.5 text-brand-muted hover:text-danger transition-colors" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border">
              <span className="text-xs text-brand-muted">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="p-1.5 text-brand-muted hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = page < 3 ? i : page - 2 + i;
                  if (pageNum >= totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded text-xs font-medium ${
                        page === pageNum ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-muted hover:text-white'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 text-brand-muted hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(v => {
            const photo = getPhoto(v);
            return (
              <Link
                key={v.id}
                to={`/inventory/${v.id}`}
                className="bg-brand-card border border-brand-border rounded-xl overflow-hidden hover:border-brand-gold/20 transition-all group"
              >
                <div className="aspect-[16/10] bg-brand-darker overflow-hidden">
                  {photo ? (
                    <img src={photo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Car size={24} className="text-brand-muted/20" /></div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-white font-bold text-sm">{v.year} {v.make} {v.model}</div>
                  <div className="text-brand-muted text-xs mt-0.5">{v.trim || ''} &bull; {v.mileage?.toLocaleString()} mi</div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-brand-gold font-bold">${v.asking_price?.toLocaleString() || '—'}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      v.status === 'active' ? 'text-success' : v.status === 'sold' ? 'text-brand-gold' : 'text-brand-muted'
                    }`}>{v.status}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
