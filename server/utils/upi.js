import QRCode from 'qrcode';

/**
 * Builds standard Indian UPI Intent URI
 * Format: upi://pay?pa=UPI_ID&pn=PAYEE_NAME&am=AMOUNT&cu=INR&tn=NOTE&tr=TXN_REF
 */
export function buildUpiString({ upiId, payeeName, amount, transactionRef, note }) {
  const cleanUpiId = (upiId || '').trim();
  const cleanPayee = encodeURIComponent((payeeName || 'Vendor Merchant').trim());
  const formattedAmount = Number(amount).toFixed(2);
  const cleanNote = encodeURIComponent((note || 'Payment').trim());
  const cleanRef = encodeURIComponent((transactionRef || '').trim());

  return `upi://pay?pa=${cleanUpiId}&pn=${cleanPayee}&am=${formattedAmount}&cu=INR&tn=${cleanNote}&tr=${cleanRef}`;
}

/**
 * Generates a high quality QR Code as base64 Data URL
 */
export async function generateQrDataUrl(upiString) {
  return await QRCode.toDataURL(upiString, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 2,
    width: 380,
    color: {
      dark: '#111827', // Deep slate for crisp scanning
      light: '#ffffff',
    },
  });
}

/**
 * Splits a total bill into payment slices according to either:
 * 1) A fixed number of splits (splitCount, e.g. 2, 3, 4 equal QRs)
 * 2) The maximum allowed QR amount (maxQrLimit, e.g. ₹1,999)
 */
export function splitBillAmount(totalAmount, maxQrLimit, splitCount) {
  const total = Number(totalAmount);

  if (isNaN(total) || total <= 0) {
    throw new Error('Total amount must be greater than 0');
  }

  // 1. If a specific number of QRs is requested (2, 3, 4, etc.)
  if (splitCount && Number(splitCount) > 1) {
    const count = Math.min(10, Math.max(2, parseInt(splitCount, 10)));
    const base = Math.floor((total / count) * 100) / 100;
    const slices = [];
    let allocated = 0;
    for (let i = 0; i < count - 1; i++) {
      slices.push(base);
      allocated += base;
    }
    // Final slice takes the exact remainder to prevent rounding errors
    const remainder = Math.round((total - allocated) * 100) / 100;
    slices.push(remainder);
    return slices;
  }

  // 2. Otherwise split automatically by maxQrLimit (default ₹1,999)
  const limit = Math.max(1, Number(maxQrLimit) || 1999);
  const slices = [];
  let remaining = total;

  while (remaining > 0) {
    if (remaining > limit) {
      slices.push(limit);
      remaining = Math.round((remaining - limit) * 100) / 100;
    } else {
      slices.push(remaining);
      remaining = 0;
    }
  }

  return slices;
}

