import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Sparkles, ShoppingBag, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIReorderHub = () => {
  const [analysis, setAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReorderData();
  }, []);

  const fetchReorderData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/forecast');
      if (res.data.success) {
        setAnalysis(res.data.analysis || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgency) => {
    if (urgency.includes('CRITICAL')) {
      return <span className="badge badge-danger">CRITICAL (OUT OF STOCK)</span>;
    }
    if (urgency.includes('HIGH')) {
      return <span className="badge badge-warning">HIGH URGENCY</span>;
    }
    if (urgency.includes('MEDIUM')) {
      return <span className="badge badge-warning">MEDIUM</span>;
    }
    return <span className="badge badge-success">OPTIMAL STOCK</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>AI Smart Reorder Optimization</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Formula considers: <strong style={{ color: 'var(--text-main)' }}>Current Stock + Predicted 30d Sales Velocity + Lead Time (7d) + Safety Stock</strong>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/purchases')}>
          <ShoppingBag size={18} /> Open Purchase Hub
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Current Stock</th>
              <th>Reorder Point (ROP)</th>
              <th>Safety Stock</th>
              <th>AI 30d Forecast</th>
              <th>Recommended Order Qty</th>
              <th>Urgency Status</th>
              <th>Quick Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Calculating smart reorder metrics...</td></tr>
            ) : analysis.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No reorder suggestions.</td></tr>
            ) : (
              analysis.map(item => {
                const rec = item.reorder_recommendation || {};
                return (
                  <tr key={item.product_id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.product_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Category: {item.category}</div>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.current_stock}</td>
                    <td>{rec.reorder_point} Units</td>
                    <td>{rec.safety_stock} Units</td>
                    <td style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{item.forecast_30d} Units</td>
                    <td>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: rec.recommended_order_quantity > 0 ? 'var(--warning)' : 'var(--success)' }}>
                        {rec.recommended_order_quantity > 0 ? `+${rec.recommended_order_quantity} Units` : '0 (Sufficient)'}
                      </span>
                    </td>
                    <td>{getUrgencyBadge(rec.urgency || 'LOW')}</td>
                    <td>
                      {rec.recommended_order_quantity > 0 ? (
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => navigate('/purchases')}
                        >
                          Restock Now <ArrowRight size={14} />
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <CheckCircle2 size={14} color="#10b981" /> No order needed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AIReorderHub;
