import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Unlock,
  Trash2,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

const UsersManagementPage = () => {
  const navigate = useNavigate();
  const { user: currentAdmin, isAuthenticated, isAdmin, loading: authLoading } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Action states
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login?redirect=/users', { replace: true });
      } else if (!isAdmin) {
        navigate('/', { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get('/users');
      if (response.data?.success) {
        setUsers(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.response?.data?.error || 'Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Toggle user restriction
  const handleToggleRestrict = async (targetUser) => {
    if (targetUser.id === currentAdmin?.id) {
      setError('You cannot restrict your own administrator account.');
      return;
    }

    setUpdatingUserId(targetUser.id);
    setError(null);
    setSuccessMsg('');

    const newRestrictedState = !targetUser.isRestricted;

    try {
      const response = await axiosClient.patch(`/users/${targetUser.id}/restrict`, {
        isRestricted: newRestrictedState,
      });

      if (response.data?.success) {
        const updated = response.data.data;
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, isRestricted: updated.isRestricted } : u))
        );
        const actionWord = newRestrictedState ? 'restricted' : 'unrestricted';
        setSuccessMsg(`User "${targetUser.name}" has been successfully ${actionWord}.`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to toggle user restriction:', err);
      setError(err.response?.data?.error || 'Failed to update user status.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Delete user (admin action)
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    setError(null);

    try {
      await axiosClient.delete(`/users/${userToDelete.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setSuccessMsg(`User "${userToDelete.name}" deleted successfully.`);
      setUserToDelete(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError(err.response?.data?.error || 'Failed to delete user.');
    } finally {
      setDeletingUser(false);
    }
  };

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery));

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'restricted' && u.isRestricted) ||
        (statusFilter === 'active' && !u.isRestricted);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Metrics
  const stats = useMemo(() => {
    const total = users.length;
    const restricted = users.filter((u) => u.isRestricted).length;
    const active = total - restricted;
    const customers = users.filter((u) => u.role === 'customer').length;
    const staff = users.filter((u) => u.role === 'staff').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    return { total, restricted, active, customers, staff, admins };
  }, [users]);

  if (authLoading || (loading && users.length === 0)) {
    return (
      <div className="users-loading-wrap">
        <Loader2 size={36} className="animate-spin text-amber-600" />
        <p>Loading user management console...</p>
      </div>
    );
  }

  return (
    <div className="page-container users-page">
      {/* Header */}
      <div className="users-header-card">
        <div className="flex items-center gap-3">
          <div className="users-header-icon">
            <Users size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">User Management</h1>
            <p className="text-sm text-slate-500">
              Manage restaurant patrons, kitchen staff, and restrict unauthorized accounts.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="users-metrics-grid">
        <div className="user-metric-card">
          <span className="metric-label">Total Users</span>
          <span className="metric-value text-slate-900">{stats.total}</span>
        </div>
        <div className="user-metric-card">
          <span className="metric-label">Active Users</span>
          <span className="metric-value text-emerald-600">{stats.active}</span>
        </div>
        <div className="user-metric-card">
          <span className="metric-label">Restricted Users</span>
          <span className="metric-value text-rose-600">{stats.restricted}</span>
        </div>
        <div className="user-metric-card">
          <span className="metric-label">Role Breakdown</span>
          <span className="metric-value-sm">
            {stats.customers} Cust · {stats.staff} Staff · {stats.admins} Admins
          </span>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="profile-alert alert-success mb-4">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="profile-alert alert-error mb-4">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="users-controls-card">
        <div className="users-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              &times;
            </button>
          )}
        </div>

        <div className="users-filters-group">
          {/* Role Filter */}
          <div className="filter-item">
            <span className="filter-label">Role:</span>
            <select
              className="user-filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="customer">Customers ({stats.customers})</option>
              <option value="staff">Staff ({stats.staff})</option>
              <option value="admin">Administrators ({stats.admins})</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-item">
            <span className="filter-label">Status:</span>
            <select
              className="user-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses ({users.length})</option>
              <option value="active">Active ({stats.active})</option>
              <option value="restricted">Restricted ({stats.restricted})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table / Mobile Cards */}
      <div className="users-table-card">
        {filteredUsers.length === 0 ? (
          <div className="users-empty-state">
            <UserX size={44} className="text-slate-300" />
            <p className="font-bold text-slate-700 mt-2">No matching users found</p>
            <p className="text-sm text-slate-500">Try adjusting your search criteria or role filters.</p>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact Info</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrentAdmin = u.id === currentAdmin?.id;
                  const isRestricted = Boolean(u.isRestricted);
                  const isUpdating = updatingUserId === u.id;

                  return (
                    <tr key={u.id} className={isRestricted ? 'row-restricted' : ''}>
                      {/* Name & ID */}
                      <td>
                        <div className="user-table-identity">
                          <div className={`user-avatar-sm ${isRestricted ? 'avatar-restricted' : ''}`}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{u.name}</span>
                              {isCurrentAdmin && (
                                <span className="you-pill">(You)</span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">ID #{u.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td>
                        <div className="user-contact-col">
                          <span className="user-email-text">
                            <Mail size={13} className="shrink-0 text-slate-400" />
                            <span>{u.email}</span>
                          </span>
                          {u.phone && (
                            <span className="user-phone-text">
                              <Phone size={13} className="shrink-0 text-slate-400" />
                              <span>{u.phone}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td>
                        <span className={`role-badge role-badge-${u.role}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-pill ${isRestricted ? 'status-pill-restricted' : 'status-pill-active'}`}>
                          {isRestricted ? '🔴 Restricted' : '🟢 Active'}
                        </span>
                      </td>

                      {/* Created date */}
                      <td className="text-sm text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="user-actions-group">
                          {/* Restrict / Unrestrict Button */}
                          <button
                            type="button"
                            className={`btn-action-restrict ${
                              isRestricted ? 'btn-unrestrict' : 'btn-restrict'
                            }`}
                            onClick={() => handleToggleRestrict(u)}
                            disabled={isCurrentAdmin || isUpdating}
                            title={
                              isCurrentAdmin
                                ? 'You cannot restrict your own account'
                                : isRestricted
                                ? 'Click to unrestrict user'
                                : 'Click to restrict user from ordering and logging in'
                            }
                          >
                            {isUpdating ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : isRestricted ? (
                              <>
                                <Unlock size={14} />
                                <span>Unrestrict</span>
                              </>
                            ) : (
                              <>
                                <Ban size={14} />
                                <span>Restrict</span>
                              </>
                            )}
                          </button>

                          {/* Delete User Button */}
                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => setUserToDelete(u)}
                            disabled={isCurrentAdmin}
                            title={
                              isCurrentAdmin
                                ? 'You cannot delete your own account from here'
                                : 'Permanently delete user'
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete User Modal */}
      {userToDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content delete-modal-card">
            <div className="delete-modal-icon">
              <AlertTriangle size={32} />
            </div>

            <h3 className="delete-modal-title">Delete User Account</h3>
            <p className="delete-modal-warning">
              Are you sure you want to delete user <strong>"{userToDelete.name}"</strong> ({userToDelete.email})?
              All order history and data for this user will be removed.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setUserToDelete(null)}
                disabled={deletingUser}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={confirmDeleteUser}
                disabled={deletingUser}
              >
                {deletingUser ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagementPage;
