import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Lock, Mail, User, Phone, Shield, ArrowRight, UserPlus, LogIn } from 'lucide-react';

const Login = () => {
  const { user, login, register, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode defaults to Sign In ('/login') unless explicitly visiting '/register'
  const [isRegisterMode, setIsRegisterMode] = useState(
    location.pathname === '/register'
  );

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Owner');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    setIsRegisterMode(location.pathname === '/register');
    setError('');
    setSuccessMsg('');
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isRegisterMode) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      const res = await register(name, email, password, role, phone);
      if (res.success) {
        setSuccessMsg('Account created successfully!');
        setTimeout(() => navigate('/'), 600);
      } else {
        setError(res.message);
      }
    } else {
      const res = await login(email, password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message);
      }
    }
  };

  const switchTab = (mode) => {
    setIsRegisterMode(mode === 'register');
    setError('');
    setSuccessMsg('');
    if (mode === 'register') {
      navigate('/register', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.25), transparent 40%), radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.25), transparent 40%), var(--bg-primary)',
      padding: '1.5rem 1rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.12)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'var(--accent-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '0.75rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Sparkles size={30} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>StockMind AI</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            AI-Powered Retail Inventory & Forecasting Platform
          </p>
        </div>

        {/* Tab Navigation Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => switchTab('login')}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              background: !isRegisterMode ? 'var(--accent-gradient)' : 'transparent',
              color: !isRegisterMode ? '#fff' : 'var(--text-muted)'
            }}
          >
            <LogIn size={16} /> Sign In
          </button>

          <button
            type="button"
            onClick={() => switchTab('register')}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              background: isRegisterMode ? 'var(--accent-gradient)' : 'transparent',
              color: isRegisterMode ? '#fff' : 'var(--text-muted)'
            }}
          >
            <UserPlus size={16} /> Sign Up
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid var(--danger)',
            color: '#ef4444',
            padding: '0.75rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid var(--success)',
            color: '#22c55e',
            padding: '0.75rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {isRegisterMode && (
            <>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', height: '44px' }}
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Phone Number (Optional)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', height: '44px' }}
                    placeholder="e.g. +1 555-0198"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Account Position Role
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  height: '44px'
                }}>
                  <Shield size={18} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    System Owner (Full Platform Access)
                  </span>
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '2.5rem', height: '44px' }}
                placeholder="e.g. user@retail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: '2.5rem', height: '44px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {isRegisterMode && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', height: '44px' }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', height: '44px', fontSize: '0.95rem', marginTop: '0.5rem' }}
          >
            {loading
              ? (isRegisterMode ? 'Creating Account...' : 'Authenticating...')
              : (isRegisterMode ? 'Create Account & Sign In' : 'Sign In to Dashboard')}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
