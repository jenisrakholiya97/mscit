import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  Boxes, 
  TrendingUp, 
  Sparkles, 
  FileText, 
  Users, 
  AlertTriangle,
  LogOut,
  Building2
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAdmin, isManager } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, role: 'all' },
    { label: 'Products', path: '/products', icon: Package, role: 'all' },
    { label: 'POS Billing', path: '/pos', icon: ShoppingCart, role: 'all' },
    { label: 'Purchases', path: '/purchases', icon: Truck, role: 'manager' },
    { label: 'Inventory Audit', path: '/inventory', icon: Boxes, role: 'all' },
    { label: 'Expiry Alerts', path: '/expiry', icon: AlertTriangle, role: 'all' },
    { label: 'AI Demand Forecast', path: '/ai-forecast', icon: TrendingUp, role: 'all', badge: 'AI' },
    { label: 'AI Smart Reorder', path: '/ai-reorder', icon: Sparkles, role: 'all', badge: 'AI' },
    { label: 'Reports', path: '/reports', icon: FileText, role: 'manager' },
    { label: 'Suppliers', path: '/suppliers', icon: Building2, role: 'manager' },
    { label: 'User Management', path: '/users', icon: Users, role: 'admin' },
  ];

  const filteredItems = navItems.filter(item => {
    if (item.role === 'admin') return isAdmin;
    if (item.role === 'manager') return isManager;
    return true;
  });

  return (
    <aside style={{
      width: '260px',
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 1rem',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingLeft: '0.5rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff'
        }}>
          <Sparkles size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            StockMind AI
          </h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Smart Inventory
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
        {filteredItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.88rem',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.2s ease'
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '6px'
                }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Card */}
      <div style={{
        marginTop: 'auto',
        padding: '0.85rem',
        borderRadius: '12px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{user?.name}</div>
          <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{user?.role}</span>
        </div>
        <button 
          onClick={logout} 
          title="Logout" 
          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.3rem' }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
