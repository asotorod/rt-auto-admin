import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import {
  LayoutDashboard, Car, Users, Handshake, BarChart3, Settings,
  ChevronLeft, ChevronRight, LogOut, Bell, Search, Menu, X, User, Flame
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', minRole: 'viewer' },
  { path: '/inventory', icon: Car, label: 'Inventory', minRole: 'viewer' },
  { path: '/leads', icon: Users, label: 'Leads', minRole: 'salesperson', badge: 'leads' },
  { path: '/deals', icon: Handshake, label: 'Deals', minRole: 'salesperson' },
  { path: '/reporting', icon: BarChart3, label: 'Reporting', minRole: 'manager' },
  { path: '/settings', icon: Settings, label: 'Settings', minRole: 'admin' },
];

export default function AdminLayout() {
  const { profile, dealership, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newLeadCount, setNewLeadCount] = useState(0);
  const [staleLeadCount, setStaleLeadCount] = useState(0);

  useEffect(() => {
    if (profile?.dealership_id) fetchLeadCounts();
    const interval = setInterval(() => {
      if (profile?.dealership_id) fetchLeadCounts();
    }, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  async function fetchLeadCounts() {
    try {
      // New leads count
      const { count: newCount } = await supabase
        .from('leads').select('*', { count: 'exact', head: true })
        .eq('dealership_id', profile.dealership_id).eq('status', 'new');
      setNewLeadCount(newCount || 0);

      // Stale leads count (using dealership config)
      const { data: config } = await supabase
        .from('dealerships').select('lead_stale_days, lead_warning_days')
        .eq('id', profile.dealership_id).single();
      const staleDays = config?.lead_stale_days || 7;
      const cutoff = new Date(Date.now() - staleDays * 86400000).toISOString();
      const { count: staleCount } = await supabase
        .from('leads').select('*', { count: 'exact', head: true })
        .eq('dealership_id', profile.dealership_id)
        .not('status', 'in', '(sold,lost,dead)')
        .not('assigned_to', 'is', null)
        .lt('last_contacted_at', cutoff);
      setStaleLeadCount(staleCount || 0);
    } catch (err) { /* silently fail */ }
  }

  const handleSignOut = async () => { await signOut(); navigate('/login'); };
  const initials = profile ? `${(profile.first_name?.[0] || '').toUpperCase()}${(profile.last_name?.[0] || '').toUpperCase()}` : '??';
  const totalBadge = newLeadCount + staleLeadCount;

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-brand-border transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center px-4 border-b border-brand-border">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-brand-gold flex items-center justify-center"><span className="text-brand-dark font-bold">RT</span></div>
              <div className="leading-tight"><div className="font-bold text-white">RT Auto Center</div><div className="text-xs text-brand-muted uppercase tracking-wider">Admin Panel</div></div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-brand-gold flex items-center justify-center mx-auto"><span className="text-brand-dark font-bold">RT</span></div>
          )}
        </div>

        <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3.5 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-muted hover:text-white hover:bg-sidebar-hover'} ${collapsed ? 'justify-center px-2' : ''}`}>
              <div className="relative">
                <item.icon size={20} />
                {collapsed && item.badge === 'leads' && totalBadge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">{totalBadge}</span>
                )}
              </div>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge === 'leads' && (
                <div className="ml-auto flex items-center gap-1.5">
                  {newLeadCount > 0 && <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{newLeadCount}</span>}
                  {staleLeadCount > 0 && <span className="bg-red-500/80 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Flame size={9} />{staleLeadCount}</span>}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex items-center justify-center h-10 border-t border-brand-border text-brand-muted hover:text-white transition-colors">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="border-t border-brand-border p-3.5">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0"><span className="text-brand-gold text-sm font-bold">{initials}</span></div>
            {!collapsed && <div className="flex-1 min-w-0"><div className="text-white font-medium truncate">{profile?.first_name} {profile?.last_name}</div><div className="text-xs text-brand-muted uppercase tracking-wider">{profile?.role}</div></div>}
            {!collapsed && <button onClick={handleSignOut} className="text-brand-muted hover:text-danger transition-colors" title="Sign out"><LogOut size={18} /></button>}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-brand-border bg-brand-darker/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-brand-muted hover:text-white"><Menu size={22} /></button>
            <div className="hidden sm:flex items-center gap-2.5 bg-brand-card border border-brand-border rounded-lg px-4 py-2.5 w-72">
              <Search size={16} className="text-brand-muted" />
              <input type="text" placeholder="Search vehicles, leads, deals..." className="bg-transparent border-none text-white placeholder:text-brand-muted/50 w-full focus:outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-brand-muted hover:text-white transition-colors">
              <Bell size={20} />
              {totalBadge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[9px] text-white flex items-center justify-center font-bold">{totalBadge}</span>}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-5 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
