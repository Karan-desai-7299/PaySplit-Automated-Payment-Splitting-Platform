import React, { useState } from 'react';
import { Shield, Store, Lock, User, AlertCircle, X, Sparkles } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.token, data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleQuickLogin(userType) {
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('janedoe');
      setPassword('vendor123');
    }
    setError('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-3 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Sign in to UPI PayFlow</h3>
          <p className="text-xs text-slate-500 mt-1">
            Access your Administrator Portal or Vendor Workspace
          </p>
        </div>

        {/* Quick Demo Pre-fill Pills */}
        <div className="mb-5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick Demo Logins
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition flex items-center gap-2 text-xs font-medium text-slate-800"
            >
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">Admin</p>
                <p className="text-[10px] text-slate-500">admin / admin123</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('vendor')}
              className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition flex items-center gap-2 text-xs font-medium text-slate-800"
            >
              <Store className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">Vendor</p>
                <p className="text-[10px] text-slate-500">janedoe / vendor123</p>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username / Vendor ID</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="e.g. admin or janedoe"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 active:scale-[0.99] transition shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-5">
          Customers do not need an account to pay. Simply scan the generated QR.
        </p>
      </div>
    </div>
  );
}
