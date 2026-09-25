import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Lock,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Printer,
  Sparkles,
  ExternalLink,
  ArrowRight,
  IndianRupee,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api';
import Logo from './Logo';

export default function CustomerPaymentPage({ sessionId }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingSliceId, setConfirmingSliceId] = useState(null);
  const [paidAlert, setPaidAlert] = useState(false);

  // Fetch session data
  async function fetchSession() {
    try {
      const data = await api.getPaymentSessionPublic(sessionId);
      setSession(data);
      setError('');

      if (data.status === 'COMPLETED') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      }
    } catch (err) {
      setError(err.message || 'Unable to load payment session');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSession();
    const intervalId = setInterval(fetchSession, 3000);
    return () => clearInterval(intervalId);
  }, [sessionId]);

  // When customer confirms payment on their phone
  async function handleConfirmPayment(sliceId) {
    setConfirmingSliceId(sliceId);
    try {
      const res = await api.confirmCustomerPayment({
        sessionId,
        sliceId,
      });

      setPaidAlert(true);
      setTimeout(() => setPaidAlert(false), 3000);

      // Refresh session state
      await fetchSession();

      if (res.isFullyComplete) {
        confetti({ particleCount: 160, spread: 90, origin: { y: 0.45 } });
      }
    } catch (err) {
      alert(err.message || 'Payment verification failed');
    } finally {
      setConfirmingSliceId(null);
    }
  }

  if (loading && !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-600">Loading secure payment...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-3xl border border-red-200 shadow-sm text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-900">Bill Unavailable</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">{error || 'Session expired or not found'}</p>
        </div>
      </div>
    );
  }

  const isCompleted = session.status === 'COMPLETED';
  const progressPercent = Math.min(100, Math.round((session.amountPaid / session.totalAmount) * 100));

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6">
      <div className="max-w-md mx-auto space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between py-2">
          <Logo />
          <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
            {session.sessionId}
          </span>
        </div>

        {/* Payment Confirmation Banner */}
        {paidAlert && (
          <div className="p-3.5 rounded-2xl bg-emerald-500 text-white flex items-center gap-2.5 shadow-md animate-in zoom-in-95 duration-200 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 shrink-0 stroke-[2.5]" />
            <span>Payment received! Vendor screen updated ✓</span>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/90 relative overflow-hidden">
          {/* Header Accent */}
          <div className={`h-2 absolute top-0 left-0 right-0 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`} />

          {/* Payee Info */}
          <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 block">
                Paying Merchant
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                {session.payeeName || session.vendorName}
              </h2>
              {session.paymentNote && (
                <p className="text-xs text-slate-500 mt-0.5">Note: {session.paymentNote}</p>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Total Bill</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                ₹{session.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>{session.completedSlices} of {session.totalSlices} Parts Paid</span>
              <span className="text-blue-600">
                ₹{session.amountPaid.toLocaleString('en-IN')} / ₹{session.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Slices List */}
          <div className="space-y-3.5">
            {session.slices.map((slice, index) => {
              const isSlicePaid = slice.status === 'PAID';
              const isUnlocked = index === 0 || session.slices[index - 1].status === 'PAID';
              const isCurrent = !isSlicePaid && isUnlocked;

              return (
                <div
                  key={slice.sliceId}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    isSlicePaid
                      ? 'bg-emerald-50/70 border-emerald-400'
                      : isCurrent
                      ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-600/10'
                      : 'bg-slate-50/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                        {slice.sliceIndex}
                      </span>
                      <span className="text-xs font-black text-slate-800">
                        Part {slice.sliceIndex} of {session.totalSlices}
                      </span>
                    </div>

                    <span className={`text-base font-black ${isSlicePaid ? 'text-emerald-700' : 'text-slate-900'}`}>
                      ₹{slice.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* If Paid: Show Green Badge */}
                  {isSlicePaid ? (
                    <div className="pt-2 flex items-center justify-between text-xs text-emerald-800 font-bold border-t border-emerald-200">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Payment Received ✓</span>
                      </span>
                      {slice.bankRrn && (
                        <span className="text-[10px] font-mono text-emerald-700">{slice.bankRrn}</span>
                      )}
                    </div>
                  ) : isCurrent ? (
                    /* Active Slice Action Buttons */
                    <div className="pt-2 space-y-2 border-t border-slate-100">
                      {/* Step 1: Open Google Pay / PhonePe / Paytm */}
                      <a
                        href={slice.upiString}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-sm shadow-blue-600/20"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Pay ₹{slice.amount} in Google Pay / PhonePe</span>
                      </a>

                      {/* Step 2: One-tap Confirm button */}
                      <button
                        onClick={() => handleConfirmPayment(slice.sliceId)}
                        disabled={confirmingSliceId === slice.sliceId}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                      >
                        {confirmingSliceId === slice.sliceId ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>I Have Paid ₹{slice.amount} ✓</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Complete Part {index} first</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Full Completion View */}
          {isCompleted && (
            <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-in zoom-in-95 duration-400">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="font-black text-base text-slate-900">All Payments Complete!</h3>
              <p className="text-xs text-slate-500 mt-0.5">Thank you for your payment.</p>
              <button
                onClick={() => window.print()}
                className="mt-3 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Save Receipt</span>
              </button>
            </div>
          )}

          {/* Security Footer */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Direct UPI Transfer to {session.payeeName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
