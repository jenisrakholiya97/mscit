import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Components & Pages
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import POS from './pages/POS';
import Purchases from './pages/Purchases';
import InventoryAudit from './pages/InventoryAudit';
import ExpiryAlerts from './pages/ExpiryAlerts';
import AIDemandForecast from './pages/AIDemandForecast';
import AIReorderHub from './pages/AIReorderHub';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import UserManagement from './pages/UserManagement';

const ProtectedLayout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar isOpen={isDesktop || sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ 
        flex: 1, 
        marginLeft: isDesktop ? '260px' : '0px', 
        display: 'flex', 
        flexDirection: 'column', 
        minWidth: 0,
        transition: 'margin-left 0.3s ease'
      }}>
        <Header onToggleSidebar={!isDesktop ? () => setSidebarOpen(!sidebarOpen) : undefined} />
        <main style={{ padding: isDesktop ? '1.75rem' : '1rem', flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/inventory" element={<InventoryAudit />} />
            <Route path="/expiry" element={<ExpiryAlerts />} />
            <Route path="/ai-forecast" element={<AIDemandForecast />} />
            <Route path="/ai-reorder" element={<AIReorderHub />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
