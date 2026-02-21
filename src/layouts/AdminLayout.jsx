import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  LayoutDashboard, Car, Users, Handshake, BarChart3, Settings,
  ChevronLeft, ChevronRight, LogOut, Bell, Search, Menu, X, User
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', minRole: 'viewer' },
  { path: '/inventory', icon: Car, label: 'Inventory', minRole: 'viewer' },
  { path: '/leads', icon: Users, label: 'Leads', minRole: 'salesperson', badge: true },
  { path: '/deals', icon: Handshake, label: 'Deals', minRole: 'salesperson' },
  { path: '/reporting', icon: BarChart3, label: 'Reporting', minRole: 'manager' },
  { path: '/settings', icon: Settings, label: 'Settings', minRole: 'admin' },
];

export default function AdminLayout() {
  const { profile, dealership, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = profile
    ? `${(profile.first_name?.[0] || '').toUpperCase()}${(profile.last_name?.[0] || '').toUpperCase()}`
    : '??';

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-brand-border
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-brand-border">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-brand-gold flex items-center justify-center">
                <span className="text-brand-dark font-bold">RT</span>
              </div>
              <div className="leading-tight">
                <div className="font-bold text-white">RT Auto Center</div>
                <div className="text-xs text-brand-muted uppercase tracking-wider">Admin Panel</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-9 h-9 rounded-lg bg-brand-gold flex items-center justify-center mx-auto">
              <span className="text-brand-dark font-bold">RT</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3.5 py-3 rounded-lg font-medium transition-all
                ${isActive
                  ? 'bg-brand-gold/10 text-brand-gold'
                  : 'text-brand-muted hover:text-white hover:bg-sidebar-hover'
                }
                ${collapsed ? 'justify-center px-2' : ''}
              `}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-brand-gold text-brand-dark text-xs font-bold px-2 py-0.5 rounded-full">11</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-10 border-t border-brand-border text-brand-muted hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* User */}
        <div className="border-t border-brand-border p-3.5">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0">
              <span className="text-brand-gold text-sm font-bold">{initials}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{profile?.first_name} {profile?.last_name}</div>
                <div className="text-xs text-brand-muted uppercase tracking-wider">{profile?.role}</div>
              </div>
            )}
            {!collapsed && (
              <button onClick={handleSignOut} className="text-brand-muted hover:text-danger transition-colors" title="Sign out">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-brand-border bg-brand-darker/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-brand-muted hover:text-white">
              <Menu size={22} />
            </button>
            <div className="hidden sm:flex items-center gap-2.5 bg-brand-card border border-brand-border rounded-lg px-4 py-2.5 w-72">
              <Search size={16} className="text-brand-muted" />
              <input
                type="text"
                placeholder="Search vehicles, leads, deals..."
                className="bg-transparent border-none text-white placeholder:text-brand-muted/50 w-full focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-brand-muted hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[9px] text-white flex items-center justify-center font-bold">3</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
