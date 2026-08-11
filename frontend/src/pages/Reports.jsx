import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, Download, FileSpreadsheet, FileCode, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reports = () => {
  const [reportType, setReportType] = useState('sales');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/data?type=${reportType}`);
      if (res.data.success) {
        setReportData(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (reportData.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${reportType.toUpperCase()}_Report`);
    XLSX.writeFile(workbook, `${reportType}_report_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportToPDF = () => {
    if (reportData.length === 0) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`AI Inventory - ${reportType.toUpperCase()} REPORT`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const headers = reportData.length > 0 ? Object.keys(reportData[0]) : [];
    const rows = reportData.map(obj => Object.values(obj).map(v => String(v ?? '')));

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    doc.save(`${reportType}_report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Automated System Reports</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Generate daily & monthly sales, purchases, profit & inventory valuation reports</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={exportToExcel} disabled={reportData.length === 0}>
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          <button className="btn btn-primary" onClick={exportToPDF} disabled={reportData.length === 0}>
            <FileCode size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="glass-panel" style={{ padding: '0.75rem', display: 'flex', gap: '0.75rem' }}>
        {['sales', 'purchases', 'inventory'].map(t => (
          <button
            key={t}
            onClick={() => setReportType(t)}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              textTransform: 'capitalize',
              background: reportType === t ? 'var(--accent-primary)' : 'transparent',
              color: reportType === t ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            {t} Report
          </button>
        ))}
      </div>

      {/* Report Table */}
      <div className="glass-panel custom-table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Generating report data...</div>
        ) : reportData.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No record data available for this report type.</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                {Object.keys(reportData[0]).map(key => (
                  <th key={key}>{key.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td key={i}>{String(val ?? '-')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Reports;
