import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AlertTriangle, Calendar, Trash2, CheckCircle } from 'lucide-react';

const ExpiryAlerts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNearExpiry();
  }, []);

  const fetchNearExpiry = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/near-expiry');
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDisposeExpired = async (p) => {
    if (window.confirm(`Dispose ${p.quantity} expired units of '${p.name}'? This will log an EXPIRED_REMOVAL audit entry and set quantity to 0.`)) {
      try {
        await api.post('/inventory/adjust', {
          product_id: p.id,
          action_type: 'EXPIRED_REMOVAL',
          quantity_change: -p.quantity,
          notes: `Disposed expired batch. Expiry date was ${p.expiry_date}`
        });
        fetchNearExpiry();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to dispose expired item');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Expiry Date Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Monitor products nearing expiration within 60 days (Medicines, Food, Cosmetics)</p>
        </div>
      </div>

      <div className="glass-panel custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Stock Quantity</th>
              <th>Expiry Date</th>
              <th>Days Remaining</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading expiry alerts...</td></tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem' }}>
                  <CheckCircle size={32} color="#10b981" style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: 600 }}>No Products Near Expiry</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All perishable inventory items are within safe freshness dates!</div>
                </td>
              </tr>
            ) : (
              products.map(p => {
                const days = p.days_until_expiry;
                const isExpired = days < 0;
                const isUrgent = days <= 15;

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Barcode: {p.barcode || 'N/A'}</div>
                    </td>
                    <td>{p.category_name || 'General'}</td>
                    <td style={{ fontWeight: 700 }}>{p.quantity} Units</td>
                    <td style={{ fontWeight: 600, color: isExpired ? 'var(--danger)' : 'var(--text-main)' }}>
                      {p.expiry_date}
                    </td>
                    <td>
                      {isExpired ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Expired {Math.abs(days)} days ago</span>
                      ) : (
                        <span>{days} days</span>
                      )}
                    </td>
                    <td>
                      {isExpired ? (
                        <span className="badge badge-danger">EXPIRED</span>
                      ) : isUrgent ? (
                        <span className="badge badge-danger">URGENT ({days}d)</span>
                      ) : (
                        <span className="badge badge-warning">NEAR EXPIRY ({days}d)</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDisposeExpired(p)}
                        title="Dispose expired stock"
                      >
                        <Trash2 size={14} /> Dispose Stock
                      </button>
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

export default ExpiryAlerts;
