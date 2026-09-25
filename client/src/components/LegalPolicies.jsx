import React, { useState } from 'react';
import { ShieldCheck, FileText, RefreshCcw, Mail, Phone, MapPin, X, User, Globe, ExternalLink } from 'lucide-react';

export default function LegalPoliciesModal({ policyType, onClose }) {
  if (!policyType) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              {policyType === 'terms' && <FileText className="w-5 h-5" />}
              {policyType === 'privacy' && <ShieldCheck className="w-5 h-5" />}
              {policyType === 'refund' && <RefreshCcw className="w-5 h-5" />}
              {policyType === 'contact' && <Mail className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {policyType === 'terms' && 'Terms and Conditions'}
                {policyType === 'privacy' && 'Privacy Policy'}
                {policyType === 'refund' && 'Refund & Cancellation Policy'}
                {policyType === 'contact' && 'Contact Us & Support'}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">PaySplit Merchant Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 pr-2 space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {policyType === 'terms' && (
            <>
              <p className="font-semibold text-slate-800">Effective Date: September 2026</p>
              <h4 className="font-black text-slate-900 text-sm">1. Introduction & Acceptance</h4>
              <p>
                Welcome to <strong>PaySplit</strong>. By accessing or using our payment splitting terminal
                and QR generation platform, you agree to comply with and be bound by these Terms and
                Conditions.
              </p>
              <h4 className="font-black text-slate-900 text-sm">2. Service Description</h4>
              <p>
                PaySplit provides authorized vendors with automated dynamic UPI and payment gateway QR code
                generation, portion splitting according to merchant limits, and instant real-time settlement
                verification via Server-Sent Events.
              </p>
              <h4 className="font-black text-slate-900 text-sm">3. Merchant Responsibilities</h4>
              <p>
                Merchants are responsible for ensuring that all UPI identifiers and bank details configured
                on PaySplit are accurate. Merchants agree not to use the platform for unlawful, fraudulent, or
                restricted transactions under Reserve Bank of India (RBI) regulations.
              </p>
              <h4 className="font-black text-slate-900 text-sm">4. Limitation of Liability</h4>
              <p>
                PaySplit operates as a technology facilitator interfacing with UPI networks and certified
                payment gateways. Transaction settlements are processed directly into the merchant's registered
                bank account.
              </p>
            </>
          )}

          {policyType === 'privacy' && (
            <>
              <p className="font-semibold text-slate-800">Effective Date: September 2026</p>
              <h4 className="font-black text-slate-900 text-sm">1. Information We Collect</h4>
              <p>
                We collect minimal necessary merchant profile information including business name, contact
                phone number, email address, and registered UPI VPA. When a bill is generated, optional
                customer mobile numbers and names are recorded for transaction reconciliation.
              </p>
              <h4 className="font-black text-slate-900 text-sm">2. Use of Information</h4>
              <p>
                Collected data is used strictly for transaction identification, billing history records,
                generating dynamic QR codes, sending payment confirmation webhooks, and preventing duplicate
                claims.
              </p>
              <h4 className="font-black text-slate-900 text-sm">3. Data Security</h4>
              <p>
                All data transmission between merchant terminals, customer browsers, and our backend is encrypted
                using industry-standard TLS/SSL protocols. We do not store sensitive bank passwords, UPI PINs,
                or debit/credit card CVVs.
              </p>
            </>
          )}

          {policyType === 'refund' && (
            <>
              <p className="font-semibold text-slate-800">Effective Date: September 2026</p>
              <h4 className="font-black text-slate-900 text-sm">1. Overview of UPI Settlements</h4>
              <p>
                Transactions facilitated through PaySplit are settled directly to the merchant's registered
                UPI account via UPI networks or certified payment gateway rails.
              </p>
              <h4 className="font-black text-slate-900 text-sm">2. Duplicate or Overpayments</h4>
              <p>
                If a customer inadvertently pays more than the requested portion or completes a duplicate
                transfer, the merchant will verify the transaction UTR number in their History dashboard and
                initiate a refund to the original payer account within <strong>3 to 5 business days</strong>.
              </p>
              <h4 className="font-black text-slate-900 text-sm">3. Failed Transactions</h4>
              <p>
                If money is debited from a customer's bank account but the QR terminal does not register payment
                due to banking network delays, the amount is automatically refunded by the customer's issuing
                bank within standard NPCI banking turnaround times (typically 24 to 48 hours).
              </p>
            </>
          )}

          {policyType === 'contact' && (
            <>
              <h4 className="font-black text-slate-900 text-sm">Customer & Merchant Support</h4>
              <p>
                For any inquiries regarding merchant onboarding, payment settlements, technical support, or platform partnership:
              </p>
              <div className="space-y-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200 mt-2">
                <div className="flex items-center gap-3 text-slate-700">
                  <User className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Contact Person: <strong className="text-slate-900">Karansinh Desai</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Mobile / Helpline:{' '}
                    <a
                      href="tel:+918830678600"
                      className="text-blue-600 hover:underline font-bold"
                    >
                      +91 88306 78600
                    </a>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Email:{' '}
                    <a
                      href="mailto:karansinhdesai91@gmail.com"
                      className="text-blue-600 hover:underline font-bold"
                    >
                      karansinhdesai91@gmail.com
                    </a>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <svg className="w-4 h-4 text-blue-600 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z" />
                  </svg>
                  <span>
                    LinkedIn:{' '}
                    <a
                      href="https://www.linkedin.com/in/karansinh-desai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
                    >
                      linkedin.com/in/karansinh-desai
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Portfolio Website:{' '}
                    <a
                      href="https://karansinh-portfolio.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
                    >
                      karansinh-portfolio.vercel.app
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Close */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
