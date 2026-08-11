import React, { useState, useEffect } from 'react';
import api from '../services/api';
import InvoiceModal from '../components/InvoiceModal';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  UserCheck, 
  DollarSign, 
  Percent, 
  CheckCircle,
  Tag
} from 'lucide-react';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch (err) {
      console.error('POS data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(search));
    const matchesCat = !selectedCategory || p.category_id === parseInt(selectedCategory, 10);
    return matchesSearch && matchesCat && p.quantity > 0;
  });

  const addToCart = (product) => {
    const existingIndex = cart.findIndex(item => item.product_id === product.id);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      if (updatedCart[existingIndex].quantity + 1 > product.quantity) {
        alert(`Cannot add more. Stock limit of ${product.quantity} reached for '${product.name}'`);
        return;
      }
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        unit_price: parseFloat(product.selling_price),
        quantity: 1,
        maxStock: product.quantity
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    const updatedCart = cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty > item.maxStock) {
          alert(`Max stock available: ${item.maxStock}`);
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);
    setCart(updatedCart);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const totalAmount = Math.max(0, subtotal - parseFloat(discount || 0) + taxAmount);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    try {
      const payload = {
        customer_name: customerName || 'Walk-in Customer',
        customer_phone: customerPhone || null,
        discount: parseFloat(discount || 0),
        tax_gst: taxAmount,
        payment_method: paymentMethod,
        items: cart.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price
        }))
      };

      const res = await api.post('/sales', payload);
      if (res.data.success) {
        setActiveReceipt(res.data.receipt);
        setCart([]);
        setDiscount(0);
        setCustomerName('Walk-in Customer');
        setCustomerPhone('');
        fetchInitialData(); // refresh stock
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', height: 'calc(100vh - 110px)' }}>
      {/* Product Catalog Side */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>POS Terminal</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scan barcode or select item</span>
        </div>

        {/* Search & Category Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name or scan barcode..."
              className="form-input"
              style={{ paddingLeft: '2.2rem', height: '40px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <select 
            className="form-select" 
            style={{ width: '170px', height: '40px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
          </select>
        </div>

        {/* Products Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '0.85rem',
          overflowY: 'auto',
          paddingRight: '0.25rem',
          flex: 1
        }}>
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>Loading items...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No in-stock items match search.
            </div>
          ) : (
            filteredProducts.map(p => (
              <div 
                key={p.id} 
                onClick={() => addToCart(p)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {p.category_name || 'General'}
                  </span>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0.2rem 0', color: 'var(--text-main)' }}>
                    {p.name}
                  </h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--success)' }}>
                    ${parseFloat(p.selling_price).toFixed(2)}
                  </span>
                  <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                    Qty: {p.quantity}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cart & Billing Side */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={18} /> Active Cart ({cart.length})
            </h3>
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Item List */}
          <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>
                Cart is empty. Click products on left to add to bill.
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product_id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.75rem',
                  background: 'var(--bg-primary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${item.unit_price.toFixed(2)} / unit</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0.75rem' }}>
                    <button 
                      onClick={() => updateQuantity(item.product_id, -1)}
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product_id, 1)}
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.88rem', width: '65px', textAlign: 'right' }}>
                    ${(item.unit_price * item.quantity).toFixed(2)}
                  </div>

                  <button 
                    onClick={() => removeFromCart(item.product_id)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', marginLeft: '0.5rem', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Customer & Totals Section */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Customer Name" 
              className="form-input" 
              style={{ fontSize: '0.8rem', height: '34px' }}
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Phone (Optional)" 
              className="form-input" 
              style={{ fontSize: '0.8rem', height: '34px' }}
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Discount ($)</label>
              <input 
                type="number" 
                className="form-input" 
                style={{ fontSize: '0.8rem', height: '34px' }}
                value={discount}
                onChange={e => setDiscount(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GST / Tax (%)</label>
              <input 
                type="number" 
                className="form-input" 
                style={{ fontSize: '0.8rem', height: '34px' }}
                value={taxPercent}
                onChange={e => setTaxPercent(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Payment</label>
              <select 
                className="form-select" 
                style={{ fontSize: '0.8rem', height: '34px' }}
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="NetBanking">NetBanking</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Tax ({taxPercent}%):</span>
              <span>+${taxAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              <span>Total Payable:</span>
              <span style={{ color: 'var(--success)' }}>${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', height: '44px', fontSize: '1rem' }}
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            <CheckCircle size={20} /> Complete Sale & Print Receipt
          </button>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      {activeReceipt && (
        <InvoiceModal 
          receipt={activeReceipt} 
          onClose={() => setActiveReceipt(null)} 
        />
      )}
    </div>
  );
};

export default POS;
