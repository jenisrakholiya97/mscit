import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { TrendingUp, Sparkles, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AIDemandForecast = () => {
  const [analysis, setAnalysis] = useState([]);
  const [sourceEngine, setSourceEngine] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchAIForecast();
  }, []);

  const fetchAIForecast = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/forecast');
      if (res.data.success) {
        setAnalysis(res.data.analysis || []);
        setSourceEngine(res.data.source || 'AI Machine Learning Engine');
        if (res.data.analysis && res.data.analysis.length > 0) {
          setSelectedProduct(res.data.analysis[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Generate simulated 30-day forecast curve for selected product
  const forecastLabels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
  const baseDemand = selectedProduct ? (selectedProduct.forecast_30d / 30) : 2;
  const forecastDailyData = Array.from({ length: 30 }, (_, i) => {
    const wave = Math.sin(i / 2) * 1.2;
    return Math.max(1, Math.round(baseDemand + wave + (i % 7 === 5 || i % 7 === 6 ? 1.5 : 0)));
  });

  const chartData = {
    labels: forecastLabels,
    datasets: [
      {
        label: `30-Day Predicted Daily Demand (${selectedProduct?.product_name || 'Item'})`,
        data: forecastDailyData,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#a855f7'
      }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* AI Header Banner */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <Sparkles size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>AI Demand Forecasting Engine</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Engine: <strong style={{ color: 'var(--text-main)' }}>{sourceEngine}</strong> | Machine Learning time-series regression
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Product Forecast Selection List */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Select Product</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '420px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>Running AI models...</div>
            ) : analysis.map(item => (
              <div
                key={item.product_id}
                onClick={() => setSelectedProduct(item)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: selectedProduct?.product_id === item.product_id ? 'var(--accent-primary)' : 'var(--bg-primary)',
                  color: selectedProduct?.product_id === item.product_id ? '#ffffff' : 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.product_name}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Stock: {item.current_stock} units</div>
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                  {item.forecast_30d} Units / 30d
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analytics & Chart */}
        {selectedProduct && (
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{selectedProduct.product_name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Category: {selectedProduct.category} | Current Stock: {selectedProduct.current_stock}
                </span>
              </div>
              <span className="badge badge-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                Confidence: {(selectedProduct.confidence_score * 100).toFixed(0)}%
              </span>
            </div>

            {/* AI Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>30-Day Predicted Sales</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                  {selectedProduct.forecast_30d} Units
                </div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Demand Velocity</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981', marginTop: '0.35rem' }}>
                  {selectedProduct.trend}
                </div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reorder Status</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.35rem', color: selectedProduct.reorder_recommendation?.should_reorder ? 'var(--warning)' : 'var(--success)' }}>
                  {selectedProduct.reorder_recommendation?.should_reorder ? 'Reorder Recommended' : 'Stock Optimal'}
                </div>
              </div>
            </div>

            {/* Daily Forecast Chart */}
            <div style={{ height: '240px' }}>
              <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDemandForecast;
