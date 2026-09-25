import { VendorRequest } from '../models/VendorRequest.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { pushChatEvent } from '../sse.js';

/**
 * Public: Submit a vendor registration request from landing page
 */
export async function submitVendorRequest(req, res) {
  try {
    const { businessName, ownerName, phone, email, upiId, address, notes } = req.body;

    if (!businessName || !ownerName || !phone || !upiId) {
      return res.status(400).json({
        error: 'Business Name, Contact Person Name, Phone Number, and UPI ID are required.',
      });
    }

    const request = await VendorRequest.create({
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: (email || '').trim().toLowerCase(),
      upiId: upiId.trim(),
      address: (address || '').trim(),
      notes: (notes || '').trim(),
      status: 'PENDING',
    });

    // Notify admin in real time if any admin is connected to SSE
    pushChatEvent('admin', {
      type: 'NEW_VENDOR_REQUEST',
      request,
    });

    return res.status(201).json({
      message: 'Your registration request has been submitted successfully! The administrator will review and activate your credentials.',
      requestId: request._id,
      phone: request.phone,
    });
  } catch (err) {
    console.error('submitVendorRequest error:', err);
    return res.status(500).json({ error: 'Failed to submit registration request. Please try again.' });
  }
}

/**
 * Public: Check request follow-up status by mobile phone number
 */
export async function checkVendorRequestStatus(req, res) {
  try {
    const { phone } = req.query;
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Mobile phone number is required.' });
    }

    const cleanPhone = phone.trim();
    // Find the latest request with this phone number
    const request = await VendorRequest.findOne({ phone: cleanPhone }).sort({ createdAt: -1 });

    if (!request) {
      return res.status(404).json({ error: 'No registration request found for this mobile number.' });
    }

    return res.json({
      status: request.status,
      businessName: request.businessName,
      ownerName: request.ownerName,
      phone: request.phone,
      upiId: request.upiId,
      assignedUsername: request.assignedUsername || null,
      assignedVendorId: request.assignedVendorId || null,
      adminNotes: request.adminNotes || null,
      createdAt: request.createdAt,
      reviewedAt: request.reviewedAt || null,
    });
  } catch (err) {
    console.error('checkVendorRequestStatus error:', err);
    return res.status(500).json({ error: 'Failed to check request status.' });
  }
}

/**
 * Admin: List all vendor requests with optional status filter
 */
export async function listVendorRequests(req, res) {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const requests = await VendorRequest.find(query).sort({ createdAt: -1 });
    return res.json(requests);
  } catch (err) {
    console.error('listVendorRequests error:', err);
    return res.status(500).json({ error: 'Failed to fetch vendor requests' });
  }
}

/**
 * Admin: Approve a vendor request and create their account
 */
export async function approveVendorRequest(req, res) {
  try {
    const { id } = req.params;
    const { username, password, maxQrAmount = 1999, adminNotes } = req.body;

    const request = await VendorRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Vendor request not found' });
    }

    if (request.status === 'APPROVED') {
      return res.status(400).json({ error: 'This request is already approved.' });
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and Password are required to approve vendor.' });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another username.' });
    }

    // Generate unique vendorId like VEND-XXXX
    const count = await User.countDocuments({ role: 'vendor' });
    const vendorId = `VEND-${String(count + 1).padStart(4, '0')}`;

    const newUser = await User.create({
      username: username.toLowerCase().trim(),
      password, // hashed by pre-save hook
      role: 'vendor',
      vendorId,
      businessName: request.businessName,
      payeeName: request.ownerName,
      upiId: request.upiId,
      maxQrAmount: Number(maxQrAmount) || 1999,
      phone: request.phone,
      email: request.email,
      isActive: true,
    });

    request.status = 'APPROVED';
    request.assignedVendorId = vendorId;
    request.assignedUsername = newUser.username;
    request.adminNotes = adminNotes || '';
    request.reviewedAt = new Date();
    await request.save();

    await AuditLog.create({
      action: 'VENDOR_REQUEST_APPROVED',
      performedBy: req.user.username,
      role: 'admin',
      vendorId,
      details: { requestId: request._id, username: newUser.username },
    });

    return res.json({
      message: 'Vendor request approved and account created successfully!',
      vendor: {
        id: newUser._id,
        username: newUser.username,
        vendorId: newUser.vendorId,
        businessName: newUser.businessName,
        upiId: newUser.upiId,
      },
      request,
    });
  } catch (err) {
    console.error('approveVendorRequest error:', err);
    return res.status(500).json({ error: 'Failed to approve request: ' + err.message });
  }
}

/**
 * Admin: Reject a vendor request
 */
export async function rejectVendorRequest(req, res) {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const request = await VendorRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Vendor request not found' });
    }

    request.status = 'REJECTED';
    request.adminNotes = adminNotes || 'Rejected by administrator';
    request.reviewedAt = new Date();
    await request.save();

    return res.json({ message: 'Request marked as rejected', request });
  } catch (err) {
    console.error('rejectVendorRequest error:', err);
    return res.status(500).json({ error: 'Failed to reject request' });
  }
}
