'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, Pencil, X, AlertTriangle } from 'lucide-react';

interface ProfileData {
  role: string | null;
  email?: string;
  userId?: string;
  storeCode?: string | null;
  storeName?: string;
  contactName?: string | null;
  contactPhone?: string | null;
  address?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales_rep: 'Sales Rep',
  store_owner: 'Store Owner',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields (store owners)
  const [isEditing, setIsEditing] = useState(false);
  const [editContactName, setEditContactName] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change (store owners)
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwChanging, setPwChanging] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then((data: ProfileData) => {
        setProfile(data);
        setEditContactName(data.contactName ?? '');
        setEditContactPhone(data.contactPhone ?? '');
        setEditAddress(data.address ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isStoreOwner = profile?.role === 'store_owner';

  function startEditing() {
    setEditContactName(profile?.contactName ?? '');
    setEditContactPhone(profile?.contactPhone ?? '');
    setEditAddress(profile?.address ?? '');
    setIsEditing(true);
    setSaveMessage(null);
  }

  async function saveProfile() {
    if (!profile?.storeCode) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const rawPhone = editContactPhone.replace(/\D/g, '');
      if (rawPhone && rawPhone.length !== 10) {
        setSaveMessage({ type: 'error', text: 'Phone number must be 10 digits' });
        setSaving(false);
        return;
      }
      const res = await fetch('/api/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: profile.storeCode,
          contact_name: editContactName.trim() || null,
          contact_phone: rawPhone || null,
          address: editAddress.trim() || null,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setProfile(prev => prev ? {
          ...prev,
          contactName: editContactName.trim() || null,
          contactPhone: rawPhone || null,
          address: editAddress.trim() || null,
        } : prev);
        setIsEditing(false);
        setSaveMessage({ type: 'success', text: 'Profile updated' });
      } else {
        setSaveMessage({ type: 'error', text: result.error ?? 'Failed to save' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (newPw !== confirmPw) {
      setPwMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPw.length < 4) {
      setPwMessage({ type: 'error', text: 'Password must be at least 4 characters' });
      return;
    }
    setPwChanging(true);
    setPwMessage(null);
    try {
      const res = await fetch('/api/store-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (data.success) {
        setPwMessage({ type: 'success', text: 'Password changed successfully' });
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
      } else {
        setPwMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch {
      setPwMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setPwChanging(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-brand-gold" />
      </div>
    );
  }

  if (!profile?.role) {
    return <div className="text-center py-12 text-gray-500 text-sm">Not authenticated</div>;
  }

  const phoneChanged = isEditing && editContactPhone.replace(/\D/g, '') !== (profile.contactPhone ?? '');

  const storeImageSrc = isStoreOwner && profile.storeCode
    ? `/stores/${encodeURIComponent(profile.storeName ?? profile.storeCode)}.jpg`
    : null;
  const storeImageFallback = isStoreOwner && profile.storeCode
    ? `/stores/${profile.storeCode}.jpg`
    : null;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h2>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
          profile.role === 'admin'
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            : profile.role === 'store_owner'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {ROLE_LABELS[profile.role] ?? profile.role}
        </span>
      </div>

      {saveMessage && (
        <div className={`mb-4 text-sm px-4 py-3 rounded-lg ${saveMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
          {saveMessage.text}
        </div>
      )}

      {/* Admin / Sales Rep — simple read-only card */}
      {!isStoreOwner && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Email</label>
            <p className="text-sm text-gray-900 dark:text-white">{profile.email ?? '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Role</label>
            <p className="text-sm text-gray-900 dark:text-white">{ROLE_LABELS[profile.role] ?? profile.role}</p>
          </div>
        </div>
      )}

      {/* Store Owner — editable profile */}
      {isStoreOwner && (
        <div className="space-y-6">
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Store Information</h3>
              {!isEditing && (
                <button
                  onClick={startEditing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:text-brand-gold hover:bg-brand-gold/10 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              )}
            </div>

            {/* Store image */}
            {storeImageSrc && (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-brand-olive/20 to-brand-gold/20 dark:from-brand-olive/30 dark:to-brand-gold/30 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                <span className="text-xl font-bold text-brand-olive/60 dark:text-brand-gold/60">
                  {(profile.storeName ?? '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>
                <img
                  src={storeImageSrc}
                  alt={profile.storeName ?? ''}
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (storeImageFallback && img.src !== window.location.origin + storeImageFallback) {
                      img.src = storeImageFallback;
                    } else {
                      img.style.display = 'none';
                    }
                  }}
                />
              </div>
            )}

            {/* Read-only fields */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Store Name</label>
              <p className="text-sm text-gray-900 dark:text-white">{profile.storeName ?? '—'}</p>
            </div>

            {/* Editable fields */}
            {isEditing ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={editContactName}
                    onChange={e => setEditContactName(e.target.value)}
                    className="w-full text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone (10 digits)</label>
                  <input
                    type="tel"
                    value={editContactPhone}
                    onChange={e => setEditContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    maxLength={10}
                  />
                  {phoneChanged && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                      Changing your phone number will update your login credential
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                    className="w-full text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-brand-gold text-white hover:bg-brand-gold/90 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setSaveMessage(null); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-surface-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Contact Name</label>
                  <p className="text-sm text-gray-900 dark:text-white">{profile.contactName ?? '—'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Phone</label>
                  <p className="text-sm text-gray-900 dark:text-white">{profile.contactPhone ?? '—'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Address</label>
                  <p className="text-sm text-gray-900 dark:text-white">{profile.address ?? '—'}</p>
                </div>
              </>
            )}
          </div>

          {/* Change Password */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Change Password</h3>
            {pwMessage && (
              <div className={`text-sm px-3 py-2 rounded-lg ${pwMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                {pwMessage.text}
              </div>
            )}
            <input
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="Current password"
              className="w-full text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="New password"
              className="w-full text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Confirm new password"
              className="w-full text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
            <button
              disabled={pwChanging || !currentPw || !newPw || !confirmPw}
              onClick={changePassword}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-brand-gold text-white hover:bg-brand-gold/90 disabled:opacity-50"
            >
              {pwChanging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Update Password
            </button>
          </div>
        </div>
      )}
    </>
  );
}
