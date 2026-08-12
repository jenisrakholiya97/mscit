import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('inventory_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('inventory_token') || null);
  const [loading, setLoading] = useState(false);
  const [rolePermissions, setRolePermissions] = useState({});

  useEffect(() => {
    if (token) {
      fetchPermissions();
    }
  }, [token]);

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/users/permissions');
      if (res.data.success) {
        setRolePermissions(res.data.permissions || {});
      }
    } catch (e) {
      // quiet fail
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('inventory_token', res.data.token);
        localStorage.setItem('inventory_user', JSON.stringify(res.data.user));
        fetchPermissions();
        return { success: true };
      }
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Invalid email or password' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role = 'Staff', phone = '') => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password, role, phone });
      if (res.data.success) {
        const loginRes = await login(email, password);
        return loginRes.success ? { success: true } : { success: true, message: 'Registered successfully! Please log in.' };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Error during registration. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        return { 
          success: true, 
          message: res.data.message, 
          resetToken: res.data.resetToken 
        };
      }
      return { success: false, message: res.data.message || 'Failed to generate reset code.' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Error requesting password reset. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email, resetToken, newPassword) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, resetToken, newPassword });
      if (res.data.success) {
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Failed to reset password.' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Error resetting password. Please check your reset code.'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('inventory_token');
    localStorage.removeItem('inventory_user');
  };

  // Normalize role names
  const normalizeRole = (r) => {
    if (!r) return 'Staff';
    if (r === 'Owner' || r === 'Admin') return 'Owner';
    if (r === 'Manager' || r === 'Store Manager') return 'Manager';
    return 'Staff';
  };

  const currentNormalizedRole = normalizeRole(user?.role);
  const isOwner = currentNormalizedRole === 'Owner';
  const isManager = currentNormalizedRole === 'Manager' || isOwner;
  const isStaff = Boolean(user);

  // Legacy mappings for backwards compatibility
  const isAdmin = isOwner;

  const hasPermission = (permissionKey) => {
    if (!user) return false;
    if (isOwner) return true; // Owner always has all permissions
    
    // 1. Check individual user-specific permission override first if present
    if (user.permissions && user.permissions[permissionKey] !== undefined) {
      return Boolean(user.permissions[permissionKey]);
    }

    // 2. Fallback to role permissions matrix
    const perms = rolePermissions[currentNormalizedRole];
    if (perms && perms[permissionKey] !== undefined) {
      return Boolean(perms[permissionKey]);
    }
    return isManager; // Fallback for managers
  };

  const updatePermissionsMatrix = async (targetRole, updatedPerms) => {
    if (!isOwner) {
      return { success: false, message: 'Only an Owner can edit role permissions.' };
    }
    try {
      const res = await api.put('/users/permissions', { role: targetRole, permissions: updatedPerms });
      if (res.data.success) {
        setRolePermissions(prev => ({
          ...prev,
          [targetRole]: updatedPerms
        }));
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update permissions' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register, 
      forgotPassword,
      resetPassword,
      logout, 
      isOwner, 
      isManager, 
      isStaff, 
      isAdmin,
      rolePermissions,
      hasPermission,
      updatePermissionsMatrix,
      fetchPermissions
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
