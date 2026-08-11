import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Truck, Plus, CheckCircle, Package, X, DollarSign } from 'lucide-react';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { product_id: '', quantity: 1, unit_cost: 0 }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purRes, supRes, prodRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/products')
      ]);
      if (purRes.data.success) setPurchases(purRes.data.purchases);
      if (supRes.data.success) setSuppliers(supRes.data.suppliers);
      if (prodRes.data.success) setProducts(prodRes.data.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setPurchaseItems([...purchaseItems, { product_id: '', quantity: 1, unit_cost: 0 }]);
  };

  const handleRemoveItemRow = (idx) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...purchaseItems];
    updated[idx][field] = value;

    if (field === 'product_id') {
      const prod = products.find(p => p.id === parseInt(value, 10));
      if (prod) {
        updated[idx].unit_cost = prod.cost_price;
      }
    }
    setPurchaseItems(updated);
  };

  const calculateTotal = () => {
    return purchaseItems.reduce((sum, item) => sum + (parseFloat(item.unit_cost || 0) * parseInt(item.quantity || 0, 10)), 0);
  };

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    const validItems = purchaseItems.filter(i => i.product_id && i.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add at least one product to purchase order');
      return;
    }

    try {
      const res = await api.post('/purchases', {
        supplier_id: selectedSupplier || null,
        notes,
        items: validItems
      });
      if (res.data.success) {
        setShowModal(false);
        setPurchaseItems([{ product_id: '', quantity: 1, unit_cost: 0 }]);
        setNotes('');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create purchase order');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Purchase Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Create purchase orders and restock inventory from suppliers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Purchase Order
        </button>
      </div>

      {/* Purchase Orders Table */}
      <div className="glass-panel custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Supplier</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Created By</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading purchases...</td></tr>
            ) : purchases.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No purchase orders recorded yet.</td></tr>
            ) : (
              purchases.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700 }}>#{p.id}</td>
                  <td>{p.supplier_name || 'General Supplier'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>${parseFloat(p.total_amount).toFixed(2)}</td>
                  <td><span className="badge badge-success">{p.status}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.notes || '-'}</td>
                  <td>{p.user_name || 'System'}</td>
                  <td style={{ fontSize: '0.82rem' }}>{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Create Purchase Order</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Supplier</label>
                <select 
                  className="form-select"
                  value={selectedSupplier}
                  onChange={e => setSelectedSupplier(e.target.value)}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>)}
                </select>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Order Items</label>
                {purchaseItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', gap: '0.5rem', alignItems: 'center' }}>
                    <select 
                      className="form-select"
                      required
                      value={item.product_id}
                      onChange={e => handleItemChange(idx, 'product_id', e.target.value)}
                    >
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (Cur Stock: {p.quantity})</option>)}
                    </select>

                    <input 
                      type="number" 
                      min="1" 
                      required 
                      placeholder="Qty"
                      className="form-input"
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                    />

                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      placeholder="Cost $"
                      className="form-input"
                      value={item.unit_cost}
                      onChange={e => handleItemChange(idx, 'unit_cost', e.target.value)}
                    />

                    <button 
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      disabled={purchaseItems.length === 1}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}

                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItemRow} style={{ width: 'fit-content', marginTop: '0.25rem' }}>
                  <Plus size={14} /> Add Another Product
                </button>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Notes / Bill Invoice No.</label>
                <textarea 
                  className="form-input" 
                  rows="2"
                  placeholder="e.g. Received batch #482 via Global Food Distro"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <span style={{ fontWeight: 600 }}>Total Order Value:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle size={16} /> Complete Purchase & Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
