import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Car, Users, Handshake, DollarSign, TrendingUp, Clock, ArrowRight, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { profile, dealership } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentVehicles, setRecentVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  async function fetchDashboardData() {
    if (!profile?.dealership_id) return;
    try {
      const [
        { count: totalVehicles },
        { count: activeVehicles },
        { count: soldVehicles },
        { data: recent }
      ] = await Promise.all([
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('dealership_id', profile.dealership_id),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('dealership_id', profile.dealership_id).eq('status', 'active'),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('dealership_id', profile.dealership_id).eq('status', 'sold'),
        supabase.from('vehicles').select('id, year, make, model, trim, asking_price, status, mileage, stock_number, in_date, vehicle_photos(url)').eq('dealership_id', profile.dealership_id).order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({ totalVehicles, activeVehicles, soldVehicles });
      setRecentVehicles(recent || []);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-brand-gold" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Inventory', value: stats?.totalVehicles || 0, icon: Car, color: 'text-info', bg: 'bg-info/10' },
    { label: 'Active Listings', value: stats?.activeVehicles || 0, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Sold Vehicles', value: stats?.soldVehicles || 0, icon: DollarSign, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
    { label: 'Avg. Days on Lot', value: '128', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-white">
          Welcome back, {profile?.first_name}
        </h1>
        <p className="text-brand-muted mt-1">
          Here's what's happening at {dealership?.name || 'your dealership'}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map(card => (
          <div key={card.label} className="bg-brand-card border border-brand-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-brand-muted text-sm font-medium uppercase tracking-wider">{card.label}</span>
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon size={18} className={card.color} />
              </div>
            </div>
            <div className="text-4xl font-bold text-white">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Inventory */}
      <div className="bg-brand-card border border-brand-border rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">Recent Inventory</h2>
          <Link to="/inventory" className="flex items-center gap-1.5 text-sm text-brand-gold hover:text-brand-gold-light transition-colors">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-brand-border">
          {recentVehicles.map(vehicle => (
            <Link
              key={vehicle.id}
              to={`/inventory/${vehicle.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-sidebar-hover transition-colors"
            >
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-brand-darker flex-shrink-0">
                {vehicle.vehicle_photos?.[0]?.url ? (
                  <img src={vehicle.vehicle_photos[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Car size={18} className="text-brand-muted/30" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">
                  {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ''}
                </div>
                <div className="text-sm text-brand-muted mt-0.5">
                  STK# {vehicle.stock_number} &bull; {vehicle.mileage?.toLocaleString()} mi
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-white font-bold text-lg">
                  ${vehicle.asking_price?.toLocaleString() || '—'}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  vehicle.status === 'active' ? 'text-success' :
                  vehicle.status === 'sold' ? 'text-brand-gold' :
                  'text-brand-muted'
                }`}>
                  {vehicle.status}
                </span>
              </div>
            </Link>
          ))}
          {recentVehicles.length === 0 && (
            <div className="px-6 py-10 text-center text-brand-muted">
              No vehicles in inventory yet.
              <Link to="/inventory/new" className="text-brand-gold hover:underline ml-1">Add your first vehicle</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
