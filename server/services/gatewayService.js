import crypto from 'crypto';
import QRCode from 'qrcode';

/**
 * Gateway Service for Dynamic UPI QR Code Generation & Webhook Processing
 * Supports:
 *  1. Razorpay Dynamic UPI QR (Single-use, auto webhook on GPay/PhonePe scan)
 *  2. Cashfree Dynamic UPI QR (PG Orders / Dynamic QR API)
 *  3. Direct UPI QR (Standard upi://pay format fallback)
 */

export function getActiveGateway() {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return {
      type: 'RAZORPAY',
      name: 'Razorpay UPI Dynamic QR',
      configured: true,
      keyId: process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.substring(0, 8)}...` : '',
    };
  }

  if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
    return {
      type: 'CASHFREE',
      name: 'Cashfree Dynamic UPI QR',
      configured: true,
      env: process.env.CASHFREE_ENV || 'sandbox',
    };
  }

  return {
    type: 'DIRECT_UPI',
    name: 'Standard Direct UPI (No Gateway Keys Set)',
    configured: false,
  };
}

/**
 * Generate a dynamic QR code for a bill portion (slice)
 */
export async function createSliceQrCode({
  amount,
  sessionId,
  sliceId,
  sliceIndex,
  totalSlices,
  vendor,
  transactionRef,
  paymentNote,
}) {
  const active = getActiveGateway();

  // ─── 1. RAZORPAY UPI DYNAMIC QR / PAYMENT LINK ──────────────────────────
  if (active.type === 'RAZORPAY') {
    try {
      const authHeader =
        'Basic ' +
        Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString('base64');

      const refId = `${sessionId.replace(/[^a-zA-Z0-9]/g, '')}_${sliceIndex}_${Date.now()}`.substring(0, 40);

      const payload = {
        amount: Math.round(Number(amount) * 100), // in paise
        currency: 'INR',
        accept_partial: false,
        description: `Bill ${sessionId} - QR ${sliceIndex} of ${totalSlices}`,
        reference_id: refId,
        notes: {
          sessionId,
          sliceId,
          sliceIndex: String(sliceIndex),
          transactionRef,
        },
        reminder_enable: false,
      };

      const res = await fetch('https://api.razorpay.com/v1/payment_links', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.short_url) {
        console.log(`[Razorpay PaymentLink] Created ${data.id} (${data.short_url}) for ₹${amount}`);
        const qrCodeDataUrl = await QRCode.toDataURL(data.short_url, {
          width: 380,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
        });

        return {
          gateway: 'RAZORPAY',
          gatewayQrId: data.id,
          qrCodeDataUrl,
          upiString: data.short_url,
        };
      } else {
        console.error('[Razorpay PaymentLink Error] Response:', data);
      }
    } catch (err) {
      console.error('[Razorpay PaymentLink Exception]:', err.message);
    }
  }

  // ─── 2. CASHFREE DYNAMIC QR ──────────────────────────────────────────────
  if (active.type === 'CASHFREE') {
    try {
      const baseUrl =
        process.env.CASHFREE_ENV === 'production'
          ? 'https://api.cashfree.com/pg'
          : 'https://sandbox.cashfree.com/pg';

      const orderId = `${sessionId.replace(/[^a-zA-Z0-9]/g, '')}_${sliceIndex}_${Date.now()}`.substring(0, 45);

      const orderPayload = {
        order_id: orderId,
        order_amount: Number(amount),
        order_currency: 'INR',
        customer_details: {
          customer_id: `cust_${sessionId.replace(/[^a-zA-Z0-9]/g, '')}`,
          customer_phone: '9999999999',
        },
        order_meta: {
          notify_url: `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:5000'}/api/webhook/cashfree`,
        },
        order_tags: {
          sessionId,
          sliceId,
          sliceIndex: String(sliceIndex),
        },
      };

      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (res.ok && data.order_id) {
        console.log(`[Cashfree Order] Created Order ${data.order_id} for ₹${amount}`);
        // If Cashfree provides dynamic QR or payment link, render as QR
        const cfPaymentUrl = data.payment_link || data.payments?.url;
        let qrCodeDataUrl = '';
        if (cfPaymentUrl) {
          qrCodeDataUrl = await QRCode.toDataURL(cfPaymentUrl, { width: 380, margin: 2 });
        } else {
          // Standard UPI format with Cashfree order tag
          const upiString = `upi://pay?pa=${vendor.upiId}&pn=${encodeURIComponent(
            vendor.businessName || 'Merchant'
          )}&am=${Number(amount).toFixed(2)}&cu=INR&tr=${orderId}&tn=${encodeURIComponent(
            `CF ${orderId}`
          )}`;
          qrCodeDataUrl = await QRCode.toDataURL(upiString, { width: 380, margin: 2 });
        }

        return {
          gateway: 'CASHFREE',
          gatewayQrId: data.order_id,
          qrCodeDataUrl,
          upiString: cfPaymentUrl || `upi://pay?tr=${orderId}&am=${amount}`,
        };
      } else {
        console.error('[Cashfree Error] Response:', data);
      }
    } catch (err) {
      console.error('[Cashfree Exception]:', err.message);
    }
  }

  // ─── 3. DIRECT STANDARD UPI FALLBACK ─────────────────────────────────────
  // High-standard UPI deep link: opens Google Pay, PhonePe, Paytm, BHIM directly
  const noteText = paymentNote
    ? `${paymentNote} (${sliceIndex}/${totalSlices})`
    : `Bill ${sessionId} Part ${sliceIndex}/${totalSlices}`;

  const params = new URLSearchParams({
    pa: vendor.upiId,
    pn: vendor.payeeName || vendor.businessName || vendor.username || 'Merchant',
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: noteText,
    tr: transactionRef,
  });

  const upiString = `upi://pay?${params.toString()}`;
  const qrCodeDataUrl = await QRCode.toDataURL(upiString, {
    width: 380,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
  });

  return {
    gateway: 'DIRECT_UPI',
    gatewayQrId: '',
    qrCodeDataUrl,
    upiString,
  };
}

/**
 * Verify Razorpay Webhook Signature
 */
export function verifyRazorpaySignature(rawBody, signature, secret) {
  if (!secret) return true; // If no secret configured, allow in dev
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return expected === signature;
  } catch (err) {
    console.error('[Razorpay Signature Error]:', err);
    return false;
  }
}
