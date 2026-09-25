import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Store,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Edit2,
  Trash2,
  KeyRound,
  RefreshCw,
  Search,
  Activity,
  Layers,
  IndianRupee,
  FileText,
  AlertTriangle,
  MessageSquare,
  Inbox,
  UserCheck,
  Send,
  Phone,
  Mail,
  Clock,
  Check,
} from 'lucide-react';
import { api } from '../api';
import ChatBox from './ChatBox';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [vendorRequests, setVendorRequests] = useState([]);
  const [chatThreads, setChatThreads] = useState([]);
  const [selectedChatVendor, setSelectedChatVendor] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('vendors'); // 'vendors' | 'requests' | 'chat' | 'sessions' | 'logs'

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Forms state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    businessName: '',
    payeeName: '',
    upiId: '',
    maxQrAmount: 1999,
    phone: '',
    email: '',
  });

  const [approveData, setApproveData] = useState({
    username: '',
    password: '',
    maxQrAmount: 1999,
    adminNotes: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    setError('');
    try {
      const [statsData, vendorsData, sessionsData, logsData, requestsData, threadsData] =
        await Promise.all([
          api.getAdminStats(),
          api.listVendors(),
          api.getAllSessions(),
          api.getAuditLogs(),
          api.listVendorRequests(),
          api.getChatThreads().catch(() => []),
        ]);

      setStats(statsData);
      setVendors(vendorsData);
      setSessions(sessionsData);
      setLogs(logsData);
      setVendorRequests(requestsData);
      setChatThreads(threadsData);

      if (threadsData.length > 0 && !selectedChatVendor) {
        setSelectedChatVendor(threadsData[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load administrator data');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(vendor) {
    try {
      await api.toggleVendorStatus(vendor._id);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to toggle status');
    }
  }

  async function handleDeleteVendor(vendor) {
    if (!window.confirm(`Are you sure you want to permanently delete vendor "${vendor.businessName || vendor.username}"?`)) {
      return;
    }
    try {
      await api.deleteVendor(vendor._id);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to delete vendor');
    }
  }

  async function handleCreateVendor(e) {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await api.createVendor({
        ...formData,
        maxQrAmount: Number(formData.maxQrAmount),
      });
      setShowCreateModal(false);
      setFormData({
        username: '',
        password: '',
        businessName: '',
        payeeName: '',
        upiId: '',
        maxQrAmount: 1999,
        phone: '',
        email: '',
      });
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to create vendor');
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleEditVendor(e) {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await api.updateVendor(selectedVendor._id, {
        businessName: formData.businessName,
        payeeName: formData.payeeName,
        upiId: formData.upiId,
        maxQrAmount: Number(formData.maxQrAmount),
        phone: formData.phone,
        email: formData.email,
      });
      setShowEditModal(false);
      setSelectedVendor(null);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to update vendor');
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await api.resetVendorPassword(selectedVendor._id, newPassword);
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedVendor(null);
      alert('Password reset successfully!');
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setFormSubmitting(false);
    }
  }

  function openEdit(vendor) {
    setSelectedVendor(vendor);
    setFormData({
      username: vendor.username,
      businessName: vendor.businessName || '',
      payeeName: vendor.payeeName || '',
      upiId: vendor.upiId || '',
      maxQrAmount: vendor.maxQrAmount || 1999,
      phone: vendor.phone || '',
      email: vendor.email || '',
    });
    setShowEditModal(true);
  }

  function openResetPassword(vendor) {
    setSelectedVendor(vendor);
    setNewPassword('');
    setShowPasswordModal(true);
  }

  function openApproveModal(req) {
    setSelectedRequest(req);
    // suggest username based on owner or business name
    const raw = (req.businessName || req.ownerName || 'vendor').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const suggestedUsername = raw.slice(0, 10) + Math.floor(100 + Math.random() * 900);
    setApproveData({
      username: suggestedUsername,
      password: 'vendor123',
      maxQrAmount: 1999,
      adminNotes: 'Welcome to PaySplit! Your vendor account is active. Your initial password is vendor123.',
    });
    setShowApproveModal(true);
  }

  async function handleApproveRequest(e) {
    e.preventDefault();
    if (!selectedRequest) return;
    setFormSubmitting(true);
    try {
      await api.approveVendorRequest(selectedRequest._id, approveData);
      setShowApproveModal(false);
      setSelectedRequest(null);
      alert('Vendor account created and approved successfully!');
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to approve request');
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleRejectRequest(req) {
    if (!window.confirm(`Reject registration request for "${req.businessName}"?`)) return;
    try {
      await api.rejectVendorRequest(req._id, { adminNotes: 'Declined by administrator' });
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to reject request');
    }
  }

  const filteredVendors = vendors.filter((v) => {
    const s = search.toLowerCase();
    return (
      v.username?.toLowerCase().includes(s) ||
      v.vendorId?.toLowerCase().includes(s) ||
      v.businessName?.toLowerCase().includes(s) ||
      v.upiId?.toLowerCase().includes(s)
    );
  });

  const pendingRequestsCount = vendorRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Administrator Console
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              Master Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Vendor accounts, access requests, real-time live support chat, and payment auditing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadAllData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setFormData({
                username: '',
                password: '',
                businessName: '',
                payeeName: '',
                upiId: '',
                maxQrAmount: 1999,
                phone: '',
                email: '',
              });
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-blue-600/20 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Vendor</span>
          </button>
        </div>
      </div>

      {/* ── Stats Summary Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Registered Vendors
          </span>
          <span className="text-3xl font-black text-slate-900 tracking-tight">
            {stats?.vendors?.total || vendors.length}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
            {stats?.vendors?.active || vendors.filter((v) => v.isActive).length} active now
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Pending Requests
          </span>
          <span className="text-3xl font-black text-blue-600 tracking-tight">
            {pendingRequestsCount}
          </span>
          <span className="text-[11px] text-slate-500 font-semibold block mt-1">
            Submitted from landing page
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total UPI Collected
          </span>
          <span className="text-3xl font-black text-slate-900 tracking-tight">
            ₹{(stats?.financials?.totalAmountCollected || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
            {stats?.sessions?.completed || 0} completed bills
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            QR Slices Generated
          </span>
          <span className="text-3xl font-black text-slate-900 tracking-tight">
            {stats?.financials?.totalQrsGenerated || 0}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Sequential split codes</span>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto text-xs sm:text-sm font-bold gap-4 sm:gap-6">
        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'vendors'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Vendors ({vendors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'requests'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Vendor Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-black">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'chat'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Live Chat ({chatThreads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'sessions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Payments & QRs ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Logs ({logs.length})</span>
        </button>
      </div>

      {/* ── TAB 1: VENDORS DIRECTORY ── */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor name, ID, UPI..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="text-xs text-slate-500">
              Showing {filteredVendors.length} of {vendors.length} vendors
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">Vendor ID</th>
                  <th className="py-3 px-3">Store & Username</th>
                  <th className="py-3 px-3">Receiving UPI ID</th>
                  <th className="py-3 px-3">Max QR Limit</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">{vendor.vendorId}</td>
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-900">{vendor.businessName || '—'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">@{vendor.username}</p>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-blue-700 font-semibold">{vendor.upiId || '—'}</td>
                    <td className="py-3.5 px-3 font-bold text-slate-800">
                      ₹{vendor.maxQrAmount?.toLocaleString('en-IN') || 1999}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          vendor.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {vendor.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedChatVendor({
                              vendorId: vendor.vendorId,
                              username: vendor.username,
                              businessName: vendor.businessName,
                            });
                            setActiveTab('chat');
                          }}
                          title="Chat with vendor"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(vendor)}
                          title="Edit Profile"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openResetPassword(vendor)}
                          title="Reset Password"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 hover:text-amber-700 text-slate-600 transition"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(vendor)}
                          title={vendor.isActive ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg border transition ${
                            vendor.isActive
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {vendor.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteVendor(vendor)}
                          title="Delete permanently"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: VENDOR REQUESTS (Landing Page Submissions) ── */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Vendor Account Requests</h2>
            <p className="text-xs text-slate-500">
              Prospective shop owners who filled the access request form on the landing page.
            </p>
          </div>

          {vendorRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No registration requests submitted yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-3">Shop & Owner</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">UPI ID</th>
                    <th className="py-3 px-3">Notes / Location</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendorRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-slate-900">{req.businessName}</p>
                        <p className="text-[11px] text-slate-500">{req.ownerName}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-slate-800">{req.phone}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                          <a
                            href={`tel:${req.phone}`}
                            className="text-blue-600 hover:underline font-bold"
                          >
                            Call
                          </a>
                          <span className="text-slate-300">•</span>
                          <a
                            href={`https://wa.me/91${req.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hello ${req.ownerName}, this is regarding your PaySplit vendor account request for ${req.businessName}.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:underline font-bold"
                          >
                            WhatsApp
                          </a>
                        </div>
                        {req.email && <p className="text-[10px] text-slate-400 mt-0.5">{req.email}</p>}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-blue-700 font-bold">{req.upiId}</td>
                      <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate">{req.notes || req.address || '—'}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : req.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {req.status}
                        </span>
                        {req.assignedUsername && (
                          <p className="text-[10px] text-slate-400 mt-0.5">User: @{req.assignedUsername}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openApproveModal(req)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Approve & Create</span>
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req)}
                              className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: LIVE VENDOR CHAT ── */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
            {/* Vendor Threads List */}
            <div className="border-r border-slate-200 p-4 bg-slate-50/50">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">
                Vendor Conversations ({chatThreads.length})
              </h3>
              <div className="space-y-1.5 overflow-y-auto max-h-[440px]">
                {chatThreads.map((thread) => {
                  const isSelected = selectedChatVendor?.vendorId === thread.vendorId;
                  return (
                    <button
                      key={thread.vendorId}
                      onClick={() => setSelectedChatVendor(thread)}
                      className={`w-full text-left p-3 rounded-xl transition border flex flex-col ${
                        isSelected
                          ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate">
                          {thread.businessName || thread.username}
                        </span>
                        {thread.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-black">
                            {thread.unreadCount} new
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{thread.vendorId}</span>
                      <p className="text-[11px] text-slate-500 truncate mt-1">
                        {thread.lastMessage || 'No messages yet'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Chat Window */}
            <div className="md:col-span-2 p-4 flex flex-col h-[520px]">
              {selectedChatVendor ? (
                <ChatBox
                  currentUser={{ role: 'admin', username: 'admin' }}
                  targetVendorId={selectedChatVendor.vendorId}
                  targetVendorName={selectedChatVendor.businessName || selectedChatVendor.username}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                  <MessageSquare className="w-8 h-8 mb-2 text-slate-300" />
                  Select a vendor from the left to start real-time messaging
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: PLATFORM PAYMENT SESSIONS ── */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">Session ID</th>
                  <th className="py-3 px-3">Vendor</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Slices</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{s.sessionId}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{s.vendorId}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900">{s.customerName || 'Anonymous'}</p>
                      {s.customerPhone && <p className="text-[11px] text-slate-400">{s.customerPhone}</p>}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      ₹{s.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {s.completedSlices}/{s.totalSlices} paid
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: AUDIT LOGS ── */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Vendor Context</th>
                  <th className="py-3 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">{log.action}</td>
                    <td className="py-3 px-3 text-slate-700">@{log.performedBy}</td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{log.vendorId || '—'}</td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: Approve Vendor Request ── */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900">Approve Vendor Request</h3>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 mb-4 text-xs space-y-1">
              <p>
                <span className="font-bold text-blue-900">Shop:</span> {selectedRequest.businessName}
              </p>
              <p>
                <span className="font-bold text-blue-900">Owner:</span> {selectedRequest.ownerName} ({selectedRequest.phone})
              </p>
              <p>
                <span className="font-bold text-blue-900">UPI ID:</span> {selectedRequest.upiId}
              </p>
            </div>

            <form onSubmit={handleApproveRequest} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={approveData.username}
                  onChange={(e) => setApproveData({ ...approveData, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Initial Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={approveData.password}
                  onChange={(e) => setApproveData({ ...approveData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Max QR Limit (₹)
                </label>
                <input
                  type="number"
                  value={approveData.maxQrAmount}
                  onChange={(e) => setApproveData({ ...approveData, maxQrAmount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Follow-Up Instructions for Vendor <span className="text-slate-400 font-normal">(shown on vendor's status check)</span>
                </label>
                <textarea
                  rows={2}
                  value={approveData.adminNotes}
                  onChange={(e) => setApproveData({ ...approveData, adminNotes: e.target.value })}
                  placeholder="e.g. Your account is active! Initial password is password123. Contact WhatsApp for your QR stand."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  {formSubmitting ? 'Creating...' : 'Activate & Approve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Create Vendor ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900">Create New Vendor</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Store / Business Name *</label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payee Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.payeeName}
                    onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Receiving UPI ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max QR Limit (₹)</label>
                  <input
                    type="number"
                    value={formData.maxQrAmount}
                    onChange={(e) => setFormData({ ...formData, maxQrAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  {formSubmitting ? 'Creating...' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Vendor ── */}
      {showEditModal && selectedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900">
                Edit Vendor ({selectedVendor.vendorId})
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleEditVendor} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Store / Business Name</label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payee Name</label>
                  <input
                    type="text"
                    required
                    value={formData.payeeName}
                    onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Receiving UPI ID</label>
                  <input
                    type="text"
                    required
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max QR Limit (₹)</label>
                  <input
                    type="number"
                    value={formData.maxQrAmount}
                    onChange={(e) => setFormData({ ...formData, maxQrAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Reset Password ── */}
      {showPasswordModal && selectedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-black text-lg text-slate-900 mb-1">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-4">Vendor: @{selectedVendor.username}</p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
