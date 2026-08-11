import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, color = 'primary' }) => {
  const colorMap = {
    primary: 'var(--accent-gradient)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  };

  return (
    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <h3 style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '0.3rem', color: 'var(--text-main)' }}>
          {value}
        </h3>
        {trend && (
          <div style={{ fontSize: '0.75rem', marginTop: '0.4rem', color: trend.startsWith('+') || trend.includes('Stable') || trend.includes('Optimal') ? '#10b981' : '#f59e0b' }}>
            {trend}
          </div>
        )}
      </div>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        background: colorMap[color] || colorMap.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
      }}>
        <Icon size={24} />
      </div>
    </div>
  );
};

export default StatCard;
