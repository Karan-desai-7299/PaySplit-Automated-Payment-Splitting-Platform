import React, { useState } from 'react';
import { QrCode, Lock, User, AlertCircle, Zap } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 items-center justify-center shadow-xl shadow-indigo-900/40 mb-4">
            <QrCode className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">UPI SplitPay</h1>
          <p className="text-indigo-300/80 text-sm mt-1">
            Vendor Payment Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/[0.06] backdrop-blur-xl rounded-3xl border border-white/10 p-7 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-xs mb-6">Sign in to your dashboard</p>

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="e.g. admin or vendor01"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.08] border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.08] border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-900/40 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-500 mt-6">
            Only vendors and admins can log in.
            <br />Contact your administrator for account access.
          </p>
        </div>
      </div>
    </div>
  );
}
