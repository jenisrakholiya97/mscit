import React, { useState, useEffect } from 'react';
import api from '../services/api';
import BarcodeModal from '../components/BarcodeModal';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  QrCode, 
  Filter, 
  AlertTriangle,
  Calendar,
  X
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const Products = () => {
  const { isManager, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterNearExpiry, setFilterNearExpiry] = useState(false);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    cost_price: '',
    selling_price: '',
    quantity: '',
    reorder_level: '10',
    barcode: '',
    qr_code: '',
    supplier_id: '',
    expiry_date: '',
    image_url: ''
  });

  useEffect(() => {
    fetchCategoriesAndSuppliers();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, filterLowStock, filterNearExpiry]);

  const fetchCategoriesAndSuppliers = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        api.get('/categories'),
        api.get('/suppliers')
      ]);
      if (catRes.data.success) setCategories(catRes.data.categories);
      if (supRes.data.success) setSuppliers(supRes.data.suppliers);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category_id = selectedCategory;
      if (filterLowStock) params.low_stock = 'true';
      if (filterNearExpiry) params.near_expiry = 'true';

      const res = await api.get('/products', { params });
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      cost_price: '',
      selling_price: '',
      quantity: '10',
      reorder_level: '10',
      barcode: '',
      qr_code: '',
      supplier_id: suppliers[0]?.id || '',
      expiry_date: '',
      image_url: ''
    });
    setShowProductModal(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category_id: p.category_id || '',
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      quantity: p.quantity,
      reorder_level: p.reorder_level,
      barcode: p.barcode || '',
      qr_code: p.qr_code || '',
      supplier_id: p.supplier_id || '',
      expiry_date: p.expiry_date || '',
      image_url: p.image_url || ''
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setShowProductModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete product '${name}'?`)) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Product Catalog</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage product inventory, pricing, barcodes & expiry dates</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} /> Add New Product
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name, barcode..."
            className="form-input"
            style={{ paddingLeft: '2.2rem', height: '38px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select 
          className="form-select" 
          style={{ width: '180px', height: '38px' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
        </select>

        <button 
          className={`btn btn-sm ${filterLowStock ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => setFilterLowStock(!filterLowStock)}
        >
          <AlertTriangle size={14} /> Low Stock Only
        </button>

        <button 
          className={`btn btn-sm ${filterNearExpiry ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => setFilterNearExpiry(!filterNearExpiry)}
        >
          <Calendar size={14} /> Near Expiry
        </button>
      </div>

      {/* Product Table */}
      <div className="glass-panel custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Cost Price</th>
              <th>Selling Price</th>
              <th>Stock Qty</th>
              <th>Barcode / QR</th>
              <th>Expiry Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading catalog...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No products found.</td></tr>
            ) : (
              products.map(p => {
                const isLow = p.quantity <= p.reorder_level;
                const isOut = p.quantity === 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: #{p.id}</div>
                    </td>
                    <td>{p.category_name || 'General'}</td>
                    <td>${parseFloat(p.cost_price).toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>${parseFloat(p.selling_price).toFixed(2)}</td>
                    <td>
                      {isOut ? (
                        <span className="badge badge-danger">Out of Stock (0)</span>
                      ) : isLow ? (
                        <span className="badge badge-warning">Low ({p.quantity})</span>
                      ) : (
                        <span className="badge badge-success">{p.quantity} Units</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-secondary" 
                        onClick={() => setSelectedBarcodeProduct(p)}
                        title="View Barcode / QR Code"
                      >
                        <QrCode size={14} /> View Code
                      </button>
                    </td>
                    <td>
                      {p.expiry_date ? (
                        <span style={{ fontSize: '0.82rem', color: new Date(p.expiry_date) < new Date() ? 'var(--danger)' : 'var(--text-main)' }}>
                          {p.expiry_date}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {isManager && (
                          <button className="btn btn-sm btn-secondary" onClick={() => handleOpenEditModal(p)} title="Edit">
                            <Edit size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteProduct(p.id, p.name)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Barcode Modal */}
      {selectedBarcodeProduct && (
        <BarcodeModal 
          product={selectedBarcodeProduct} 
          onClose={() => setSelectedBarcodeProduct(null)} 
        />
      )}

      {/* Product Add/Edit Modal */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Product Name</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Category</label>
                  <select 
                    className="form-select" 
                    value={formData.category_id} 
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Supplier</label>
                  <select 
                    className="form-select" 
                    value={formData.supplier_id} 
                    onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Cost Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    className="form-input" 
                    value={formData.cost_price} 
                    onChange={e => setFormData({ ...formData, cost_price: e.target.value })} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Selling Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    className="form-input" 
                    value={formData.selling_price} 
                    onChange={e => setFormData({ ...formData, selling_price: e.target.value })} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Quantity</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input" 
                    value={formData.quantity} 
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Reorder Level</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.reorder_level} 
                    onChange={e => setFormData({ ...formData, reorder_level: e.target.value })} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Expiry Date (Optional)</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formData.expiry_date} 
                    onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Barcode (Auto-generated if empty)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 890100..." 
                    value={formData.barcode} 
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>QR Code Code</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. QR-PROD..." 
                    value={formData.qr_code} 
                    onChange={e => setFormData({ ...formData, qr_code: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProductModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
