import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, UserPlus, Shield, Trash2, X, Lock, ShieldAlert, CheckCircle2, ShieldCheck, Settings, User, RotateCcw, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MAX_USERS_LIMIT = 5;

const UserManagement = () => {
  const { user: currentUser, isOwner, rolePermissions, updatePermissionsMatrix, fetchPermissions } = useAuth();
  
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'permissions'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPermission, setSavingPermission] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // Modal State for New User
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Staff', phone: '' });

  // Modal State for Editing User Details (Email, Password, Name, Role, Phone)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', password: '', role: 'Staff', phone: '' });

  // Modal State for Individual User Permissions Override
  const [selectedUserForPerms, setSelectedUserForPerms] = useState(null);
  const [individualPerms, setIndividualPerms] = useState({});

  // Permission features definition
  const featureList = [
    { key: 'pos_billing', label: 'POS Billing Terminal', desc: 'Process sales & print receipt invoices' },
    { key: 'manage_products', label: 'Add & Edit Products', desc: 'Create and edit product details & pricing' },
    { key: 'delete_products', label: 'Delete Catalog Products', desc: 'Permanently delete product items from database' },
    { key: 'manage_purchases', label: 'Purchase Orders & Restock', desc: 'Create purchase orders & update inventory' },
    { key: 'manage_inventory', label: 'Stock Audit & Adjustments', desc: 'Adjust stock levels & view immutable audit logs' },
    { key: 'view_reports', label: 'Financial Reports & Exports', desc: 'View revenue, profit analytics, export Excel/PDF' },
    { key: 'manage_suppliers', label: 'Supplier & Vendor Directory', desc: 'Add & manage supplier contact information' },
    { key: 'manage_users', label: 'User Account Management', desc: 'Create user accounts & update user roles' },
    { key: 'edit_permissions', label: 'Edit Role Permissions', desc: 'Modify role permission matrix (Owner position only)' },
  ];

  useEffect(() => {
    fetchUsers();
    fetchPermissions();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Restrict entire page to Owner position
  if (!isOwner) {
    return (
      <div style={{ padding: '3rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid var(--danger)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            marginBottom: '1.25rem'
          }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.5' }}>
            The <strong>User & Permissions Control Center</strong> is restricted exclusively to users in the <strong>Owner</strong> position.
          </p>
          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Logged in as: <strong>{currentUser?.name}</strong> ({currentUser?.role || 'Staff'})
          </div>
        </div>
      </div>
    );
  }

  const isLimitReached = users.length >= MAX_USERS_LIMIT;

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', msg: '' });

    if (isLimitReached) {
      setFeedback({ type: 'danger', msg: `Maximum limit of ${MAX_USERS_LIMIT} user accounts reached. Delete an existing user first.` });
      return;
    }

    try {
      const res = await api.post('/users', formData);
      if (res.data.success) {
        setShowModal(false);
        setFormData({ name: '', email: '', password: '', role: 'Staff', phone: '' });
        setFeedback({ type: 'success', msg: 'User account created successfully.' });
        fetchUsers();
      }
    } catch (err) {
      setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Failed to create user' });
    }
  };

  const handleOpenEditUserModal = (u) => {
    setSelectedUserForEdit(u);
    const mappedRole = u.role === 'Admin' ? 'Owner' : (u.role === 'Store Manager' ? 'Manager' : u.role);
    setEditFormData({
      name: u.name,
      email: u.email,
      password: '', // Blank by default unless changing
      role: mappedRole,
      phone: u.phone || ''
    });
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    setFeedback({ type: '', msg: '' });

    try {
      const res = await api.put(`/users/${selectedUserForEdit.id}`, editFormData);
      if (res.data.success) {
        setSelectedUserForEdit(null);
        setFeedback({ type: 'success', msg: `User account details updated for '${editFormData.name}'.` });
        fetchUsers();
      }
    } catch (err) {
      setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Failed to update user details' });
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Delete user '${name}'?`)) {
      setFeedback({ type: '', msg: '' });
      try {
        const res = await api.delete(`/users/${id}`);
        if (res.data.success) {
          setFeedback({ type: 'success', msg: `User '${name}' deleted successfully.` });
          fetchUsers();
        }
      } catch (err) {
        setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Failed to delete user' });
      }
    }
  };

  const handleRoleChange = async (id, newRole) => {
    setFeedback({ type: '', msg: '' });
    try {
      const res = await api.put(`/users/${id}`, { role: newRole });
      if (res.data.success) {
        setFeedback({ type: 'success', msg: 'User role updated.' });
        fetchUsers();
      }
    } catch (err) {
      setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Failed to update user role' });
    }
  };

  // Open Individual Permissions Modal
  const handleOpenIndividualPermsModal = (u) => {
    setSelectedUserForPerms(u);
    const userRole = u.role === 'Admin' ? 'Owner' : (u.role === 'Store Manager' ? 'Manager' : u.role);
    const defaultRolePerms = rolePermissions[userRole] || {};
    const initialPerms = u.permissions ? { ...u.permissions } : { ...defaultRolePerms };
    setIndividualPerms(initialPerms);
  };

  // Save Individual User Permissions
  const handleSaveIndividualPerms = async () => {
    if (!selectedUserForPerms) return;
    setSavingPermission(true);
    try {
      const res = await api.put(`/users/${selectedUserForPerms.id}/user-permissions`, {
        permissions: individualPerms
      });
      if (res.data.success) {
        setFeedback({ type: 'success', msg: `Individual permissions updated for ${selectedUserForPerms.name}.` });
        setSelectedUserForPerms(null);
        fetchUsers();
      }
    } catch (err) {
      setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Failed to update individual permissions' });
    } finally {
      setSavingPermission(false);
    }
  };

  // Reset Individual Permissions to Role Defaults
  const handleResetIndividualPerms = async () => {
    if (!selectedUserForPerms) return;
    if (window.confirm(`Reset permissions for ${selectedUserForPerms.name} to default role permissions?`)) {
      setSavingPermission(true);
      try {
        const res = await api.put(`/users/${selectedUserForPerms.id}/user-permissions`, {
          permissions: null
        });
        if (res.data.success) {
          setFeedback({ type: 'success', msg: `Permissions for ${selectedUserForPerms.name} reset to role defaults.` });
          setSelectedUserForPerms(null);
          fetchUsers();
        }
      } catch (err) {
        setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Failed to reset permissions' });
      } finally {
        setSavingPermission(false);
      }
    }
  };

  const handleTogglePermissionMatrix = async (targetRole, permKey, currentValue) => {
    setSavingPermission(true);
    const currentPerms = rolePermissions[targetRole] || {};
    const updatedPerms = { ...currentPerms, [permKey]: !currentValue };

    const res = await updatePermissionsMatrix(targetRole, updatedPerms);
    setSavingPermission(false);
    if (res.success) {
      setFeedback({ type: 'success', msg: `Updated ${permKey} permission for ${targetRole} role.` });
    } else {
      setFeedback({ type: 'danger', msg: res.message });
    }
  };

  // Group Users by Role Tier
  const owners = users.filter(u => u.role === 'Owner' || u.role === 'Admin');
  const managers = users.filter(u => u.role === 'Manager' || u.role === 'Store Manager');
  const staffMembers = users.filter(u => u.role === 'Staff' || u.role === 'Employee');

  const getRoleBadge = (role) => {
    if (role === 'Owner' || role === 'Admin') {
      return <span className="badge badge-primary" style={{ background: 'var(--accent-gradient)', color: '#fff' }}><ShieldCheck size={12} /> Owner</span>;
    }
    if (role === 'Manager' || role === 'Store Manager') {
      return <span className="badge badge-info"><Shield size={12} /> Manager</span>;
    }
    return <span className="badge badge-success"><Users size={12} /> Staff</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>User & Access Control Center</h1>
            <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
              Account Limit: {users.length} / {MAX_USERS_LIMIT}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Owner Control Panel — System positions & Individual User Permission Customization (Max {MAX_USERS_LIMIT} users)
          </p>
        </div>

        {activeTab === 'users' && (
          <button 
            className="btn btn-primary" 
            disabled={isLimitReached}
            onClick={() => setShowModal(true)}
            title={isLimitReached ? `Maximum user limit of ${MAX_USERS_LIMIT} reached` : 'Add new user'}
          >
            <UserPlus size={18} /> {isLimitReached ? `Limit Reached (${users.length}/${MAX_USERS_LIMIT})` : 'Add New User'}
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback.msg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          border: feedback.type === 'success' ? '1px solid var(--success)' : '1px solid var(--danger)',
          color: feedback.type === 'success' ? '#10b981' : '#ef4444'
        }}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          {feedback.msg}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: activeTab === 'users' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'users' ? '#ffffff' : 'var(--text-muted)'
          }}
        >
          <Users size={16} /> User Directory & Custom Permissions ({users.length}/{MAX_USERS_LIMIT})
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: activeTab === 'permissions' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'permissions' ? '#ffffff' : 'var(--text-muted)'
          }}
        >
          <Settings size={16} /> Default Role Permissions Matrix
        </button>
      </div>

      {/* TAB 1: USER DIRECTORY WITH INDIVIDUAL PERMISSIONS CONTROL */}
      {activeTab === 'users' && (
        <div className="glass-panel custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Current Position</th>
                <th>Permission Status</th>
                <th>Phone</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading user directory...</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>#{u.id}</td>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getRoleBadge(u.role)}
                        <select 
                          className="form-select"
                          style={{ width: '130px', padding: '0.25rem 0.4rem', fontSize: '0.8rem' }}
                          value={u.role === 'Admin' ? 'Owner' : (u.role === 'Store Manager' ? 'Manager' : u.role)}
                          disabled={u.id === currentUser?.id || u.role === 'Owner' || u.role === 'Admin'}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                        >
                          {(u.role === 'Owner' || u.role === 'Admin') && <option value="Owner">Owner</option>}
                          <option value="Manager">Manager</option>
                          <option value="Staff">Staff</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      {u.permissions !== null ? (
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Custom Overrides</span>
                      ) : (
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Default Role</span>
                      )}
                    </td>
                    <td>{u.phone || '-'}</td>
                    <td style={{ fontSize: '0.82rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {/* Edit User Account Details Modal Trigger */}
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleOpenEditUserModal(u)}
                          title={`Edit email, password, or details for ${u.name}`}
                        >
                          <Edit size={14} /> Edit
                        </button>

                        {/* Edit Particular User Permissions */}
                        {(u.role !== 'Owner' && u.role !== 'Admin') && (
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleOpenIndividualPermsModal(u)}
                            title={`Customize permissions for ${u.name}`}
                          >
                            <Settings size={14} /> Perms
                          </button>
                        )}

                        {u.id !== currentUser?.id && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(u.id, u.name)} title="Delete user">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: CHECKBOX ROLE PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Owner Control Info Banner */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid var(--accent-primary)',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <ShieldCheck size={20} color="var(--accent-primary)" />
            <div>
              <strong>Owner Checkbox Permission Control Center</strong>
              <div>Toggle default role checkboxes below. Individual user overrides set in the User Directory take precedence over these defaults.</div>
            </div>
          </div>

          {/* Matrix Card Table with Checkboxes */}
          <div className="glass-panel custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '38%' }}>Feature Module / Action</th>
                  <th style={{ textAlign: 'center', width: '20%' }}>
                    <div>Owner Position</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400, marginTop: '2px' }}>
                      (Full Rights)
                    </div>
                  </th>
                  <th style={{ textAlign: 'center', width: '21%' }}>
                    <div>Manager Position</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400, marginTop: '2px' }}>
                      (Checkbox Toggle)
                    </div>
                  </th>
                  <th style={{ textAlign: 'center', width: '21%' }}>
                    <div>Staff Position</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400, marginTop: '2px' }}>
                      (Checkbox Toggle)
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureList.map(feature => {
                  const managerPerm = rolePermissions['Manager']?.[feature.key] ?? (feature.key !== 'manage_users' && feature.key !== 'edit_permissions' && feature.key !== 'delete_products');
                  const staffPerm = rolePermissions['Staff']?.[feature.key] ?? (feature.key === 'pos_billing' || feature.key === 'manage_inventory');

                  return (
                    <tr key={feature.key}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{feature.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{feature.desc}</div>
                      </td>

                      {/* Owner Column - Always Enabled */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-success" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>
                          <CheckCircle2 size={14} /> Full Access
                        </span>
                      </td>

                      {/* Manager Column - Checkbox Control */}
                      <td style={{ textAlign: 'center' }}>
                        <label style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          background: managerPerm ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                          border: managerPerm ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                          transition: 'all 0.2s ease'
                        }}>
                          <input
                            type="checkbox"
                            checked={Boolean(managerPerm)}
                            disabled={savingPermission}
                            onChange={() => handleTogglePermissionMatrix('Manager', feature.key, managerPerm)}
                            style={{
                              width: '16px',
                              height: '16px',
                              accentColor: '#3b82f6',
                              cursor: 'pointer'
                            }}
                          />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: managerPerm ? '#3b82f6' : 'var(--text-muted)' }}>
                            {managerPerm ? 'Allowed' : 'Denied'}
                          </span>
                        </label>
                      </td>

                      {/* Staff Column - Checkbox Control */}
                      <td style={{ textAlign: 'center' }}>
                        <label style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          background: staffPerm ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                          border: staffPerm ? '1px solid #22c55e' : '1px solid var(--border-color)',
                          transition: 'all 0.2s ease'
                        }}>
                          <input
                            type="checkbox"
                            checked={Boolean(staffPerm)}
                            disabled={savingPermission}
                            onChange={() => handleTogglePermissionMatrix('Staff', feature.key, staffPerm)}
                            style={{
                              width: '16px',
                              height: '16px',
                              accentColor: '#22c55e',
                              cursor: 'pointer'
                            }}
                          />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: staffPerm ? '#22c55e' : 'var(--text-muted)' }}>
                            {staffPerm ? 'Allowed' : 'Denied'}
                          </span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* BELOW TIER ENTIRE PERSONS NAME DISPLAY */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="var(--accent-primary)" /> Registered Team Members by Tier ({users.length} / {MAX_USERS_LIMIT})
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Below are all registered persons categorized under each position tier:
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {/* Owner Tier Persons */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={16} /> Owner Tier ({owners.length})
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Full Access</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {owners.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No Owners assigned</div>
                  ) : (
                    owners.map(u => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.6rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        <User size={14} color="var(--accent-primary)" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Manager Tier Persons */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Shield size={16} /> Manager Tier ({managers.length})
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Operations</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {managers.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No Managers assigned</div>
                  ) : (
                    managers.map(u => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.6rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        <User size={14} color="#3b82f6" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Staff Tier Persons */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={16} /> Staff Tier ({staffMembers.length})
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Frontline</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {staffMembers.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No Staff assigned</div>
                  ) : (
                    staffMembers.map(u => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.6rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        <User size={14} color="#10b981" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW USER */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add New Position User (Max {MAX_USERS_LIMIT})</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Full Name</label>
                <input 
                  type="text" 
                  required 
                  className="form-input"
                  placeholder="e.g. Sarah Connor"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="form-input"
                  placeholder="e.g. sarah@store.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Password</label>
                <input 
                  type="password" 
                  required 
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Position / Role</label>
                  <select 
                    className="form-select"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Staff">Staff (Cashier/Sales)</option>
                    <option value="Manager">Store Manager</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Phone Number</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g. +1 555-0199"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER ACCOUNT DETAILS (EMAIL, PASSWORD, NAME, ROLE, PHONE) */}
      {selectedUserForEdit && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Edit Account: {selectedUserForEdit.name}</h3>
              <button onClick={() => setSelectedUserForEdit(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Full Name</label>
                <input 
                  type="text" 
                  required 
                  className="form-input"
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="form-input"
                  value={editFormData.email}
                  onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Reset Password (Leave blank to keep existing)
                </label>
                <input 
                  type="password" 
                  className="form-input"
                  placeholder="Enter new password (optional)"
                  value={editFormData.password}
                  onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Position / Role</label>
                  <select 
                    className="form-select"
                    value={editFormData.role}
                    onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                  >
                    <option value="Staff">Staff (Cashier/Sales)</option>
                    <option value="Manager">Store Manager</option>
                    {(selectedUserForEdit.role === 'Owner' || selectedUserForEdit.role === 'Admin') && <option value="Owner">System Owner</option>}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Phone Number</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={editFormData.phone}
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedUserForEdit(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Account Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INDIVIDUAL USER PERMISSIONS CUSTOMIZER */}
      {selectedUserForPerms && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  Customize Permissions for {selectedUserForPerms.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Position: <strong>{selectedUserForPerms.role}</strong> ({selectedUserForPerms.email})
                </div>
              </div>
              <button onClick={() => setSelectedUserForPerms(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid var(--accent-primary)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              fontSize: '0.8rem',
              marginBottom: '1rem'
            }}>
              Customizing checkboxes below sets <strong>individual permission overrides</strong> specifically for <strong>{selectedUserForPerms.name}</strong>.
            </div>

            {/* Checkbox List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '50vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {featureList.map(feature => {
                const isChecked = Boolean(individualPerms[feature.key]);
                return (
                  <label 
                    key={feature.key} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{feature.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{feature.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setIndividualPerms(prev => ({
                          ...prev,
                          [feature.key]: !isChecked
                        }));
                      }}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--accent-primary)',
                        cursor: 'pointer'
                      }}
                    />
                  </label>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={handleResetIndividualPerms}
                title="Remove custom overrides and restore role defaults"
              >
                <RotateCcw size={14} /> Reset to Role Defaults
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedUserForPerms(null)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  disabled={savingPermission}
                  onClick={handleSaveIndividualPerms}
                >
                  Save Individual Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
