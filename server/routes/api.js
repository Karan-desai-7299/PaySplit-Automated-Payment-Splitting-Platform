import express from 'express';
import { login, getMe } from '../controllers/authController.js';
import {
  getAdminDashboardStats,
  listVendors,
  createVendor,
  updateVendor,
  toggleVendorStatus,
  resetVendorPassword,
  deleteVendor,
  getAllSessions,
  getAuditLogs,
} from '../controllers/adminController.js';
import {
  getVendorDashboard,
  updateVendorSettings,
  getVendorTransactions,
} from '../controllers/vendorController.js';
import {
  createPaymentSession,
  getPaymentSession,
  verifySlicePayment,
  simulatePaymentWebhook,
  getVendorCustomers,
  getPublicPaymentSession,
  confirmCustomerPayment,
  handleRazorpayWebhook,
  handleCashfreeWebhook,
  getGatewayStatusConfig,
} from '../controllers/paymentController.js';
import {
  submitVendorRequest,
  checkVendorRequestStatus,
  listVendorRequests,
  approveVendorRequest,
  rejectVendorRequest,
} from '../controllers/requestController.js';
import {
  sendMessage,
  getMessages,
  getChatThreads,
  streamChat,
} from '../controllers/chatController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { streamPaymentSession } from '../controllers/sseController.js';

const router = express.Router();

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/login', login);
router.get('/auth/me', authenticateToken, getMe);

// ─── Public: Customer Scan-to-Pay Endpoints (Option 2) ────────────────────────
router.get('/pay/session/:sessionId', getPublicPaymentSession);
router.post('/pay/confirm', confirmCustomerPayment);

// ─── Public: Vendor Registration Requests from Landing Page ────────────────────
router.post('/requests/submit', submitVendorRequest);
router.get('/requests/status', checkVendorRequestStatus);

// ─── Public Webhooks (called by UPI gateways — no auth) ────────────────────────
// Razorpay sends webhooks here when customer scans QR in GPay/PhonePe and pays
router.post('/webhook/razorpay', handleRazorpayWebhook);
// Cashfree sends webhooks here
router.post('/webhook/cashfree', handleCashfreeWebhook);
// Generic fallback webhook
router.post('/webhook/payment', simulatePaymentWebhook);
// Check active gateway configuration
router.get('/gateway/status', getGatewayStatusConfig);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.get('/admin/stats',          authenticateToken, requireRole('admin'), getAdminDashboardStats);
router.get('/admin/vendors',        authenticateToken, requireRole('admin'), listVendors);
router.post('/admin/vendors',       authenticateToken, requireRole('admin'), createVendor);
router.put('/admin/vendors/:id',    authenticateToken, requireRole('admin'), updateVendor);
router.patch('/admin/vendors/:id/toggle', authenticateToken, requireRole('admin'), toggleVendorStatus);
router.post('/admin/vendors/:id/reset-password', authenticateToken, requireRole('admin'), resetVendorPassword);
router.delete('/admin/vendors/:id', authenticateToken, requireRole('admin'), deleteVendor);
router.get('/admin/sessions',       authenticateToken, requireRole('admin'), getAllSessions);
router.get('/admin/logs',           authenticateToken, requireRole('admin'), getAuditLogs);

// Admin: Vendor requests review & approval
router.get('/admin/requests',              authenticateToken, requireRole('admin'), listVendorRequests);
router.post('/admin/requests/:id/approve', authenticateToken, requireRole('admin'), approveVendorRequest);
router.post('/admin/requests/:id/reject',  authenticateToken, requireRole('admin'), rejectVendorRequest);

// Admin: Chat threads
router.get('/admin/chat/threads', authenticateToken, requireRole('admin'), getChatThreads);

// ─── Real-Time Communication (Chat) ───────────────────────────────────────────
router.post('/chat/send',     authenticateToken, sendMessage);
router.get('/chat/messages',  authenticateToken, getMessages);
router.get('/chat/stream',    authenticateToken, streamChat);

// ─── Vendor ───────────────────────────────────────────────────────────────────
router.get('/vendor/dashboard',     authenticateToken, requireRole('vendor'), getVendorDashboard);
router.put('/vendor/settings',      authenticateToken, requireRole('vendor'), updateVendorSettings);
router.get('/vendor/transactions',  authenticateToken, requireRole('vendor'), getVendorTransactions);
router.get('/vendor/customers',     authenticateToken, requireRole('vendor'), getVendorCustomers);

// Payment sessions (vendor-scoped)
router.post('/vendor/sessions',            authenticateToken, requireRole('vendor'), createPaymentSession);
router.get('/vendor/sessions/:sessionId',  authenticateToken, requireRole('vendor'), getPaymentSession);
// Real-time SSE stream — vendor browser listens here for instant payment events
router.get('/vendor/stream/:sessionId',    authenticateToken, requireRole('vendor'), streamPaymentSession);
// Manual verify kept for admin/fallback use
router.post('/vendor/verify',              authenticateToken, requireRole('vendor'), verifySlicePayment);

export default router;
