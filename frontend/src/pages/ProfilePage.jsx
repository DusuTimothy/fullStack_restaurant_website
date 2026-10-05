import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShoppingBag,
  ArrowRight,
  Loader2,
  AlertCircle,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, updateUserProfile, deleteAccount, logout } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Account deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/profile', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.get('/users/me');
        if (isMounted && response.data?.data) {
          const data = response.data.data;
          setProfileData(data);
          setName(data.name || '');
          setPhone(data.phone || '');
          setOrders(data.orders || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load user profile:', err);
          setError(err.response?.data?.error || 'Failed to load profile details');
          // Fallback to auth context user
          setProfileData(user);
          setName(user.name || '');
          setPhone(user.phone || '');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchProfile();
    }
  }, [user, isAuthenticated]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSuccessMsg('');
    setError(null);

    try {
      const response = await axiosClient.put(`/users/${user.id}`, {
        name: name.trim(),
        phone: phone.trim() || null,
      });

      if (response.data?.success) {
        const updated = response.data.data;
        setProfileData((prev) => ({ ...prev, ...updated }));
        updateUserProfile({ name: updated.name, phone: updated.phone });
        setProfileSuccessMsg('Profile information updated successfully!');
        setTimeout(() => setProfileSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setSavingPassword(true);
    setPasswordSuccessMsg('');
    setPasswordError('');

    try {
      await axiosClient.put(`/users/${user.id}`, {
        password: newPassword,
      });
      setPasswordSuccessMsg('Password updated successfully!');
      setNewPassword('');
      setTimeout(() => setPasswordSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type "DELETE" exactly to confirm.');
      return;
    }

    setDeletingAccount(true);
    setDeleteError('');

    try {
      await deleteAccount();
      navigate('/?accountDeleted=true', { replace: true });
    } catch (err) {
      console.error('Error deleting account:', err);
      setDeleteError(err.response?.data?.error || 'Failed to delete account. Please try again.');
      setDeletingAccount(false);
    }
  };

  if (authLoading || (loading && !profileData)) {
    return (
      <div className="profile-loading-wrap">
        <Loader2 size={36} className="animate-spin text-amber-600" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  const currentUser = profileData || user;
  const isRestricted = Boolean(currentUser?.isRestricted);
  const formattedDate = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recent Member';

  const roleBadgeClass =
    currentUser?.role === 'admin'
      ? 'role-badge-admin'
      : currentUser?.role === 'staff'
      ? 'role-badge-staff'
      : 'role-badge-customer';

  return (
    <div className="page-container profile-page">
      {/* Page Title & Breadcrumb */}
      <div className="profile-header-card">
        <div className="profile-avatar-large">
          <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}</span>
        </div>

        <div className="profile-header-info">
          <div className="profile-name-row">
            <h1 className="profile-user-name">{currentUser?.name}</h1>
            <span className={`role-badge ${roleBadgeClass}`}>
              {currentUser?.role?.toUpperCase()}
            </span>
            <span className={`status-pill ${isRestricted ? 'status-pill-restricted' : 'status-pill-active'}`}>
              {isRestricted ? '🔴 Restricted' : '🟢 Active Account'}
            </span>
          </div>

          <div className="profile-meta-row">
            <span className="profile-meta-item">
              <Mail size={15} />
              <span>{currentUser?.email}</span>
            </span>
            {currentUser?.phone && (
              <span className="profile-meta-item">
                <Phone size={15} />
                <span>{currentUser.phone}</span>
              </span>
            )}
            <span className="profile-meta-item">
              <Calendar size={15} />
              <span>Joined {formattedDate}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="profile-alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Profile Grid */}
      <div className="profile-content-grid">
        {/* Left Column: Personal Info & Security */}
        <div className="profile-left-col">
          {/* Edit Details */}
          <div className="profile-card">
            <div className="profile-card-header">
              <User size={20} className="text-amber-600" />
              <h2>Edit Profile Details</h2>
            </div>

            {profileSuccessMsg && (
              <div className="profile-alert alert-success">
                <CheckCircle2 size={16} />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-name">
                  Full Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  className="auth-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={savingProfile}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-email">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="auth-input"
                  value={currentUser?.email || ''}
                  disabled
                  title="Email cannot be changed directly"
                />
                <span className="form-input-help">Email address is permanently linked to your account</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-phone">
                  Phone Number
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  className="auth-input"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={savingProfile}
                />
              </div>

              <button type="submit" className="btn-primary profile-submit-btn" disabled={savingProfile}>
                {savingProfile ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="profile-card">
            <div className="profile-card-header">
              <Lock size={20} className="text-amber-600" />
              <h2>Change Password</h2>
            </div>

            {passwordSuccessMsg && (
              <div className="profile-alert alert-success">
                <CheckCircle2 size={16} />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}
            {passwordError && (
              <div className="profile-alert alert-error">
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="profile-form">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-new-pass">
                  New Password (min. 6 characters)
                </label>
                <input
                  id="profile-new-pass"
                  type="password"
                  className="auth-input"
                  placeholder="Enter new secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={savingPassword}
                />
              </div>

              <button
                type="submit"
                className="btn-secondary profile-submit-btn"
                disabled={savingPassword || newPassword.length < 6}
              >
                {savingPassword ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="profile-card danger-zone-card">
            <div className="profile-card-header danger-header">
              <Trash2 size={20} className="text-red-600" />
              <h2 className="text-red-700">Delete Account</h2>
            </div>
            <p className="danger-zone-desc">
              Permanently delete your account and all associated order history. This action cannot be reversed.
            </p>
            <button
              type="button"
              className="btn-danger-outline btn-delete-account"
              onClick={() => {
                setDeleteConfirmText('');
                setDeleteError('');
                setShowDeleteModal(true);
              }}
            >
              <Trash2 size={16} />
              <span>Delete My Account</span>
            </button>
          </div>
        </div>

        {/* Right Column: Order History & Activity */}
        <div className="profile-right-col">
          <div className="profile-card">
            <div className="profile-card-header justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-amber-600" />
                <h2>Order History</h2>
              </div>
              <span className="order-count-pill">{orders.length} orders</span>
            </div>

            {orders.length === 0 ? (
              <div className="profile-orders-empty">
                <UtensilsCrossed size={36} className="text-slate-300" />
                <p className="font-semibold text-slate-700">No orders placed yet</p>
                <p className="text-sm text-slate-500">Explore our delicious menu to place your first order!</p>
                <Link to="/" className="btn-primary mt-3 inline-flex items-center gap-2">
                  <span>Browse Menu</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="profile-orders-list">
                {orders.map((ord) => (
                  <div key={ord.id} className="profile-order-item">
                    <div className="profile-order-top">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Order #{ord.id}</span>
                        <span className={`status-badge-compact status-${ord.status}`}>
                          {ord.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="font-bold text-amber-700">
                        ${Number(ord.totalAmount).toFixed(2)}
                      </span>
                    </div>

                    <div className="profile-order-bottom">
                      <span className="profile-order-date">
                        <Clock size={13} />
                        <span>
                          {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                          {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>

                      {ord.notes && (
                        <p className="profile-order-notes">
                          <em>Note:</em> {ord.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <div className="profile-view-all-orders">
                  <Link to="/orders" className="btn-link-all">
                    <span>Go to full Orders page</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content delete-modal-card">
            <div className="delete-modal-icon">
              <AlertTriangle size={32} />
            </div>

            <h3 className="delete-modal-title">Delete Account Confirmation</h3>
            <p className="delete-modal-warning">
              Are you sure you want to permanently delete your account? All of your personal details, saved sessions,
              and order records will be permanently removed.
            </p>

            <div className="delete-confirm-box">
              <label htmlFor="confirm-delete-input" className="delete-confirm-label">
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                id="confirm-delete-input"
                type="text"
                className="auth-input text-center"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={deletingAccount}
                autoFocus
              />
            </div>

            {deleteError && (
              <div className="profile-alert alert-error mt-2">
                <AlertCircle size={16} />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
              >
                {deletingAccount ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Permanently Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
