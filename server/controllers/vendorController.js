import { User } from '../models/User.js';
import { PaymentSession } from '../models/PaymentSession.js';
import { CustomerTransaction } from '../models/CustomerTransaction.js';
import { AuditLog } from '../models/AuditLog.js';

/**
 * Helper to ensure customerName and customerPhone are populated on every session,
 * falling back to CustomerTransaction records for legacy sessions.
 */
async function enrichWithCustomerInfo(sessions) {
  if (!sessions || sessions.length === 0) return [];
  const sessionIdsToLookup = sessions
    .filter((s) => !s.customerName && !s.customerPhone)
    .map((s) => s.sessionId);

  let customerMap = {};
  if (sessionIdsToLookup.length > 0) {
    const custs = await CustomerTransaction.find({
      sessionId: { $in: sessionIdsToLookup },
    }).lean();
    custs.forEach((c) => {
      customerMap[c.sessionId] = c;
    });
  }

  return sessions.map((s) => {
    const item = s.toObject ? s.toObject() : { ...s };
    const cust = customerMap[item.sessionId];
    return {
      ...item,
      customerName: item.customerName || cust?.customerName || '',
      customerPhone: item.customerPhone || cust?.customerPhone || '',
      customerEmail: item.customerEmail || cust?.customerEmail || '',
    };
  });
}

export async function getVendorDashboard(req, res) {
  try {
    const vendorId = req.user.vendorId;

    // Start of today (midnight)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Today's completed revenue
    const todayAgg = await PaymentSession.aggregate([
      {
        $match: {
          vendorId,
          updatedAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          todaySales: { $sum: '$amountPaid' },
          todayTransactions: { $sum: 1 },
        },
      },
    ]);

    const todaySales = todayAgg[0]?.todaySales || 0;

    // Overall stats for this vendor
    const totalTransactions = await PaymentSession.countDocuments({ vendorId });
    const completedPayments = await PaymentSession.countDocuments({ vendorId, status: 'COMPLETED' });
    const pendingPayments = await PaymentSession.countDocuments({
      vendorId,
      status: { $in: ['PENDING', 'PARTIAL'] },
    });

    // Total QR codes generated & total amount collected ever
    const allTimeAgg = await PaymentSession.aggregate([
      { $match: { vendorId } },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$amountPaid' },
          totalQrs: { $sum: '$totalSlices' },
        },
      },
    ]);

    const totalCollected = allTimeAgg[0]?.totalCollected || 0;
    const totalQrCodes = allTimeAgg[0]?.totalQrs || 0;

    // Recent 10 transactions enriched with customer info
    const rawRecent = await PaymentSession.find({ vendorId })
      .sort({ createdAt: -1 })
      .limit(10);
    const recentTransactions = await enrichWithCustomerInfo(rawRecent);

    return res.json({
      todaySales,
      completedPayments,
      pendingPayments,
      totalTransactions,
      totalQrCodes,
      totalCollected,
      recentTransactions,
      vendor: {
        vendorId: req.user.vendorId,
        username: req.user.username,
        businessName: req.user.businessName,
        payeeName: req.user.payeeName,
        upiId: req.user.upiId,
        maxQrAmount: req.user.maxQrAmount,
      },
    });
  } catch (err) {
    console.error('getVendorDashboard error:', err);
    return res.status(500).json({ error: 'Failed to retrieve vendor dashboard data' });
  }
}

export async function updateVendorSettings(req, res) {
  try {
    const { upiId, payeeName, businessName, maxQrAmount, phone, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    if (upiId !== undefined) user.upiId = upiId.trim();
    if (payeeName !== undefined) user.payeeName = payeeName.trim();
    if (businessName !== undefined) user.businessName = businessName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (email !== undefined) user.email = email.trim();
    if (req.body.password && req.body.password.trim()) {
      user.password = req.body.password.trim();
    }
    if (maxQrAmount !== undefined) {
      const parsed = Number(maxQrAmount);
      if (parsed > 0) {
        user.maxQrAmount = parsed;
      }
    }

    await user.save();

    await AuditLog.create({
      action: 'VENDOR_SETTINGS_UPDATED',
      performedBy: user.username,
      role: 'vendor',
      vendorId: user.vendorId,
      details: { upiId: user.upiId, payeeName: user.payeeName, maxQrAmount: user.maxQrAmount },
    });

    return res.json({
      message: 'Payment settings updated successfully',
      vendor: {
        vendorId: user.vendorId,
        username: user.username,
        businessName: user.businessName,
        payeeName: user.payeeName,
        upiId: user.upiId,
        maxQrAmount: user.maxQrAmount,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('updateVendorSettings error:', err);
    return res.status(500).json({ error: 'Failed to update payment settings' });
  }
}

export async function getVendorTransactions(req, res) {
  try {
    const vendorId = req.user.vendorId;
    const { status, limit = 50, page = 1 } = req.query;

    let query = { vendorId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const rawTransactions = await PaymentSession.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const transactions = await enrichWithCustomerInfo(rawTransactions);

    const total = await PaymentSession.countDocuments(query);

    return res.json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
}
