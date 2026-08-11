import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';

const InvoiceModal = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
            <CheckCircle size={22} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Transaction Completed</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Printable Receipt Box */}
        <div id="printable-receipt" style={{
          background: '#ffffff',
          color: '#0f172a',
          padding: '1.5rem',
          borderRadius: '12px',
          fontFamily: 'monospace',
          fontSize: '0.85rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>RETAIL STORE INC.</h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>AI-Powered Inventory & POS System</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Invoice #{receipt.saleId} | {new Date(receipt.date).toLocaleString()}</p>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <div><strong>Customer:</strong> {receipt.customer}</div>
            <div><strong>Payment Method:</strong> {receipt.payment_method}</div>
          </div>

          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '0.4rem 0' }}>Item</th>
                <th style={{ padding: '0.4rem 0', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px dashed #f1f5f9' }}>
                  <td style={{ padding: '0.4rem 0' }}>{item.name}</td>
                  <td style={{ padding: '0.4rem 0', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '0.4rem 0', textAlign: 'right' }}>${parseFloat(item.total_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'right' }}>
            <div>Subtotal: ${parseFloat(receipt.subtotal).toFixed(2)}</div>
            <div>Discount: -${parseFloat(receipt.discount).toFixed(2)}</div>
            <div>Tax (GST): +${parseFloat(receipt.tax_gst).toFixed(2)}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.25rem', color: '#0f172a' }}>
              Total Paid: ${parseFloat(receipt.totalAmount).toFixed(2)}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: '#64748b' }}>
            Thank you for shopping with us!
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
