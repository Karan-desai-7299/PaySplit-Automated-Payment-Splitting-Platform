import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  User,
  Phone,
  Mail,
  Store,
  Lock,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { api } from '../api';

export default function SettingsPage({ user, onProfileUpdated }) {
  const [form, setForm] = useState({
    upiId: user?.upiId || '',
    payeeName: user?.payeeName || '',
    businessName: user?.businessName || '',
    maxQrAmount: user?.maxQrAmount || 1999,
    phone: user?.phone || '',
    email: user?.email || '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const payload = {
        upiId: form.upiId.trim(),
        payeeName: form.payeeName.trim(),
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        maxQrAmount: Number(form.maxQrAmount) || 1999,
      };

      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      const res = await api.updateVendorSettings(payload);
      setSuccess('Profile & UPI Settings saved successfully!');
      setForm((prev) => ({ ...prev, password: '' })); // clear password field
      if (onProfileUpdated) onProfileUpdated(res.vendor);
    } catch (err) {
      setError(err.message || 'Failed to update profile settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-300">
      {/* Page Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Store className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Vendor Profile & UPI</h1>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm">
          Update your UPI ID to receive customer payments, change your shop name, or set a new password.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7">
        {success && (
          <div className="mb-5 flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section: Payment UPI ID */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-blue-600" />
                UPI ID (Receiving Handle) <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-blue-200">
                Primary Account
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                name="upiId"
                value={form.upiId}
                onChange={onChange}
                required
                placeholder="yourstore@okhdfcbank or 9876543210@paytm"
                className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-mono font-bold text-blue-950 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
              />
            </div>
            <p className="text-[11px] text-blue-700/80 mt-1.5">
              All dynamic QR codes generated on your counter will deposit directly to this UPI handle.
            </p>
          </div>

          {/* Payee Name & Business Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Account Holder / Payee Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                name="payeeName"
                value={form.payeeName}
                onChange={onChange}
                required
                placeholder="e.g. Ramesh Kumar"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Name displayed on customer UPI payment screen.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Shop / Store Name</label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                name="businessName"
                value={form.businessName}
                onChange={onChange}
                placeholder="e.g. Ramesh Super Market"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="store@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
              </div>
            </div>
          </div>

          {/* Max Amount per QR */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Max Amount per Single QR (₹)</label>
              <span className="text-[11px] text-blue-600 font-semibold">NPCI Default: ₹1,999</span>
            </div>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="number"
                name="maxQrAmount"
                min="10"
                value={form.maxQrAmount}
                onChange={onChange}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Bills exceeding this limit will automatically split into sequential QR codes.
            </p>
          </div>

          {/* Update Password Option */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Update Password <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="New password (optional)"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving Changes...' : 'Save Profile & UPI Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Account Info Pill */}
      <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <div>
          <span className="font-bold text-slate-800">Vendor ID:</span> {user?.vendorId || '—'}
        </div>
        <div>
          <span className="font-bold text-slate-800">Username:</span> @{user?.username}
        </div>
      </div>
    </div>
  );
}
