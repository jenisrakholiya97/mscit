import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Boxes, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, X, ShieldAlert } from 'lucide-react';

const InventoryAudit = () => {
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [actionType, setActionType] = useState('STOCK_IN');
  const [quantityChange, setQuantityChange] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchLogsAndProducts();
  }, []);

  const fetchLogsAndProducts = async () => {
    setLoading(true);
    try {
      const [logRes, prodRes] = await Promise.all([
        api.get('/inventory/logs'),
        api.get('/products')
      ]);
      if (logRes.data.success) setLogs(logRes.data.logs);
      if (prodRes.data.success) setProducts(prodRes.data.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !quantityChange) {
      alert('Please select product and enter quantity');
      return;
    }

    try {
      const qtyNum = parseInt(quantityChange, 10);
      const finalDelta = (actionType === 'STOCK_OUT' || actionType === 'EXPIRED_REMOVAL') 
        ? -Math.abs(qtyNum) 
        : Math.abs(qtyNum);

      const res = await api.post('/inventory/adjust', {
        product_id: parseInt(selectedProduct, 10),
        action_type: actionType,
        quantity_change: finalDelta,
        notes
      });

      if (res.data.success) {
        setShowAdjustModal(false);
        setSelectedProduct('');
        setQuantityChange('');
        setNotes('');
        fetchLogsAndProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const getActionBadge = (type, qty) => {
    switch (type) {
      case 'STOCK_IN':
      case 'PURCHASE':
        return <span className="badge badge-success"><ArrowDownLeft size={12} /> +{qty} Stock In</span>;
      case 'SALE':
        return <span className="badge badge-info"><ArrowUpRight size={12} /> {qty} POS Sale</span>;
      case 'EXPIRED_REMOVAL':
        return <span className="badge badge-danger"><ShieldAlert size={12} /> {qty} Expired</span>;
      default:
        return <span className="badge badge-warning"><RefreshCw size={12} /> {qty > 0 ? `+${qty}` : qty} Adjustment</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Inventory Audit & Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Real-time immutable audit trail for stock movements & adjustments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdjustModal(true)}>
          <Plus size={18} /> Adjust Stock Level
        </button>
      </div>

      {/* Logs Table */}
      <div className="glass-panel custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Product Name</th>
              <th>Action Type</th>
              <th>Quantity Change</th>
              <th>Reason / Notes</th>
              <th>User</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading audit logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No audit logs recorded yet.</td></tr>
            ) : (
              logs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 700 }}>#{l.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{l.product_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Barcode: {l.barcode || 'N/A'}</div>
                  </td>
                  <td>{getActionBadge(l.action_type, l.quantity_change)}</td>
                  <td style={{ fontWeight: 800, color: l.quantity_change >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {l.quantity_change >= 0 ? `+${l.quantity_change}` : l.quantity_change}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{l.notes || '-'}</td>
                  <td>{l.user_name || 'System'}</td>
                  <td style={{ fontSize: '0.82rem' }}>{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Adjustment Modal */}
      {showAdjustModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Adjust Stock Level</h3>
              <button onClick={() => setShowAdjustModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Select Product</label>
                <select 
                  className="form-select" 
                  required
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="">Choose product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Current Stock: {p.quantity})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Action Type</label>
                  <select 
                    className="form-select"
                    value={actionType}
                    onChange={e => setActionType(e.target.value)}
                  >
                    <option value="STOCK_IN">Stock In (+)</option>
                    <option value="STOCK_OUT">Stock Out (-)</option>
                    <option value="ADJUSTMENT">Manual Adjustment</option>
                    <option value="EXPIRED_REMOVAL">Remove Expired (-)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Quantity Units</label>
                  <input 
                    type="number" 
                    min="1" 
                    required
                    className="form-input"
                    placeholder="e.g. 5"
                    value={quantityChange}
                    onChange={e => setQuantityChange(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Reason / Notes</label>
                <textarea 
                  className="form-input" 
                  rows="3"
                  required
                  placeholder="e.g. Stock audit recount / Damaged item replacement"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Apply Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAudit;
