import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Bell, Search, Menu } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Header = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    try {
      const res = await api.get('/products/low-stock');
      if (res.data.success) {
        setLowStockCount(res.data.count);
        setLowStockItems(res.data.products || []);
      }
    } catch (e) {
      // quiet fail
    }
  };

  return (
    <header style={{
      height: '65px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      {/* Left section: Hamburger button & Quick Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '400px' }}>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="Toggle Navigation Menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search products..."
            className="form-input"
            style={{ paddingLeft: '2.4rem', height: '38px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                navigate(`/products?search=${encodeURIComponent(e.target.value.trim())}`);
              }
            }}
          />
        </div>
      </div>

      {/* Right section: Action Controls & User info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Low Stock Alert Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
            title="Stock Notifications"
          >
            <Bell size={18} />
            {lowStockCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--danger)',
                color: '#fff',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {lowStockCount}
              </span>
            )}
          </button>

          {showAlertMenu && (
            <div className="glass-panel" style={{
              position: 'absolute',
              right: 0,
              top: '48px',
              width: '290px',
              padding: '1rem',
              zIndex: 200,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Low Stock Alerts ({lowStockCount})</span>
              </div>
              {lowStockItems.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                  All items are well stocked!
                </div>
              ) : (
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {lowStockItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>Qty: {item.quantity} (Reorder: {item.reorder_level})</div>
                      </div>
                      <button 
                        className="btn btn-sm btn-primary" 
                        onClick={() => { setShowAlertMenu(false); navigate('/ai-reorder'); }}
                      >
                        Order
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

        {/* User Info (Hidden on very small screens, displayed on tablets/desktops) */}
        <div style={{ fontSize: '0.85rem', textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user?.name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.role}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
