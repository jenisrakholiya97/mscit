import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer } from 'lucide-react';

const BarcodeModal = ({ product, onClose }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (product && product.barcode && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, product.barcode, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          font: 'Outfit',
          fontSize: 14,
          lineColor: '#0f172a'
        });
      } catch (e) {
        console.error('Barcode render error:', e);
      }
    }
  }, [product]);

  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Product Barcode & QR Code</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div id="printable-barcode" style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', color: '#000000', marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>{product.name}</h4>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>Price: ${parseFloat(product.selling_price).toFixed(2)}</p>
          
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
            <svg ref={barcodeRef}></svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
            <QRCodeSVG value={product.qr_code || product.barcode} size={120} level="H" />
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.5rem' }}>
            QR: {product.qr_code || product.barcode}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print Codes
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeModal;
