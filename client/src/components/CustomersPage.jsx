import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  IndianRupee,
  User,
  Phone,
  Filter,
  Download,
} from 'lucide-react';
import { api } from '../api';

const statusColors = {
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  PARTIAL: 'bg-amber-100 text-amber-800',
  PENDING: 'bg-slate-100 text-slate-600',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, pagination.page]);

  async function fetchCustomers(page = pagination.page) {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 20, page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.getVendorCustomers(params);
      setCustomers(res.customers);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const header = 'Name,Phone,Email,Bill Note,Total Amount,Paid,Remaining,Status,Date';
    const rows = customers.map((c) =>
      [
        c.customerName || '—',
        c.customerPhone || '—',
        c.customerEmail || '—',
        c.customerNote || '—',
        c.totalAmount,
        c.amountPaid,
        c.remainingAmount,
        c.status,
        new Date(c.createdAt).toLocaleDateString(),
      ].join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Records</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {pagination.total} total transactions recorded
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 transition shadow-2xs"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => fetchCustomers(1)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            placeholder="Search by name, phone, or session ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 appearance-none font-medium"
          >
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PARTIAL">Partial</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mb-2" />
            <p className="text-sm">Loading customer data...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <User className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-slate-500 font-medium">No customers found</p>
            <p className="text-xs text-slate-400 mt-1">
              {search ? 'Try a different search term.' : 'Create a new bill to record your first customer.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Bill Note</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {c.customerName ? c.customerName[0].toUpperCase() : '?'}
                        </div>
                        <span className="font-semibold text-slate-800">
                          {c.customerName || <span className="text-slate-300">Anonymous</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {c.customerPhone || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-[140px] truncate">
                      {c.customerNote || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{c.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      ₹{c.amountPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      ₹{c.remainingAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[c.status] || 'bg-slate-100 text-slate-600'}`}>
                        {c.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                        {c.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 font-medium transition"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 font-medium transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
