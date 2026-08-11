import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  ShoppingCart, 
  Truck, 
  Sparkles,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      if (res.data.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading AI Dashboard...</div>;
  }

  const kpis = stats?.kpis || {};
  const monthlySales = stats?.monthly_sales || [];
  const topProducts = stats?.top_products || [];

  const chartData = {
    labels: monthlySales.map(m => m.month_name) || ['Jun', 'Jul', 'Aug'],
    datasets: [
      {
        label: 'Monthly Revenue ($)',
        data: monthlySales.map(m => parseFloat(m.revenue)) || [1200, 1900, 2400],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointRadius: 5
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '1.5rem 1.75rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Retail Intelligence Overview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Real-time stock monitoring & AI-driven demand analytics
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => navigate('/pos')}>
            <ShoppingCart size={18} /> Launch POS
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/ai-forecast')}>
            <Sparkles size={18} /> View AI Insights
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard title="Total Products" value={kpis.total_products || 0} icon={Package} color="info" trend="Active catalog" />
        <StatCard title="Total Revenue" value={`$${(kpis.total_revenue || 0).toLocaleString()}`} icon={DollarSign} color="success" trend="+14% this month" />
        <StatCard title="Estimated Profit" value={`$${(kpis.estimated_profit || 0).toLocaleString()}`} icon={TrendingUp} color="primary" trend="Optimal margin" />
        <StatCard title="Low Stock Items" value={kpis.low_stock_count || 0} icon={AlertTriangle} color="warning" trend="Action required" />
        <StatCard title="Near Expiry" value={kpis.near_expiry_count || 0} icon={ShieldAlert} color="danger" trend="60 days alert" />
      </div>

      {/* Charts & Fast Moving Items Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Sales Graph */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Revenue & Sales Trend</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last 6 Months</span>
          </div>
          <div style={{ height: '280px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Top Fast Moving Products */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Fast-Moving Products</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
            {topProducts.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
                No sales data recorded yet.
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.total_units_sold} units sold</div>
                  </div>
                  <span className="badge badge-success">${parseFloat(p.total_revenue).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => navigate('/products')} 
            style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
          >
            Manage All Products <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
