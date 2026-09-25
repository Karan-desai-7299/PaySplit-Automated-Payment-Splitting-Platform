import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  PlusCircle,
  RefreshCw,
  Eye,
  AlertCircle,
  IndianRupee,
  Receipt,
} from 'lucide-react';
import { api } from '../api';

export default function VendorDashboard({ user, onNavigateToGenerate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inspectSession, setInspectSession] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getVendorDashboard();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading && !stats) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading sales records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {stats?.vendor?.businessName || 'Vendor Sales & History'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="font-mono text-blue-700 font-bold">{stats?.vendor?.upiId || 'No UPI ID set'}</span>
            {stats?.vendor?.maxQrAmount && (
              <span className="text-slate-400"> · Split limit: ₹{stats.vendor.maxQrAmount}</span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchDashboard}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onNavigateToGenerate}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Bill</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Today's Sales</p>
          <p className="text-2xl font-black tracking-tight text-slate-900">
            ₹{Number(stats?.todaySales || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Live settlements</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Completed Bills</p>
          <p className="text-2xl font-black tracking-tight text-emerald-600">
            {stats?.completedPayments ?? 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Fully paid</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Collected</p>
          <p className="text-2xl font-black tracking-tight text-blue-700">
            ₹{Number(stats?.totalCollected || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Lifetime revenue</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">QR Slices</p>
          <p className="text-2xl font-black tracking-tight text-slate-900">
            {stats?.totalQrCodes ?? 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Split payments generated</p>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Payment Records</h2>
          <span className="text-[11px] text-slate-400">
            {stats?.recentTransactions?.length || 0} transactions
          </span>
        </div>

        {/* Mobile View: Clean touch-friendly transaction cards (Phones) */}
        <div className="sm:hidden divide-y divide-slate-100">
          {stats?.recentTransactions?.map((item) => (
            <div
              key={item._id}
              onClick={() => setInspectSession(item)}
              className="p-4 active:bg-slate-50 transition cursor-pointer flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-800">{item.sessionId}</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : item.status === 'PARTIAL'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  {item.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {item.customerName || item.customerPhone || 'Anonymous'}
                  </p>
                  {item.customerName && item.customerPhone && (
                    <p className="text-xs text-slate-500 font-mono mt-0.5">📱 {item.customerPhone}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-slate-900">
                    ₹{item.totalAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] font-bold text-emerald-600">
                    Paid: ₹{item.amountPaid.toLocaleString('en-IN')} ({item.completedSlices}/{item.totalSlices})
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <span>
                  {new Date(item.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-blue-600 font-bold flex items-center gap-0.5">
                  Details →
                </span>
              </div>
            </div>
          ))}
          {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No transactions yet. Click "New Bill" to generate your first payment QR.
            </div>
          )}
        </div>

        {/* Desktop View: Full Table (Tablets & Desktop) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Parts</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentTransactions?.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{item.sessionId}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">
                      {item.customerName || item.customerPhone || 'Anonymous'}
                    </p>
                    {item.customerName && item.customerPhone && (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{item.customerPhone}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900">
                    ₹{item.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold">
                    ₹{item.amountPaid.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {item.completedSlices}/{item.totalSlices}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setInspectSession(item)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No transactions yet. Click "New Bill" to generate your first payment QR.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Session Modal */}
      {inspectSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700 block">
                  {inspectSession.sessionId}
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                  ₹{inspectSession.totalAmount.toLocaleString('en-IN')}
                </h3>
              </div>
              <button
                onClick={() => setInspectSession(null)}
                className="text-slate-400 hover:text-slate-700 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Collected: ₹{inspectSession.amountPaid}</span>
                <span>Remaining: ₹{inspectSession.remainingAmount}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{
                    width: `${Math.min(100, (inspectSession.amountPaid / inspectSession.totalAmount) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Customer Information if captured */}
            {(inspectSession.customerName || inspectSession.customerPhone) && (
              <div className="mb-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Customer Information
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {inspectSession.customerName || 'Customer'}
                </p>
                {inspectSession.customerPhone && (
                  <p className="font-mono text-slate-500 text-xs mt-0.5">
                    📱 {inspectSession.customerPhone}
                  </p>
                )}
              </div>
            )}

            {/* Slices list */}
            <div className="space-y-2">
              {inspectSession.slices.map((sl) => (
                <div
                  key={sl.sliceId}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    {sl.status === 'PAID' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="font-mono font-bold text-slate-800">{sl.sliceId}</span>
                    <span className="font-black text-slate-900">₹{sl.amount}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sl.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {sl.status === 'PAID' ? `Paid · ${sl.bankRrn || 'UPI'}` : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
