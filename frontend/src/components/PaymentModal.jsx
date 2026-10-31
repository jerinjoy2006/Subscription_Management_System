import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import api from '../api/client';

export const PaymentModal = ({ invoice, onClose, onPaymentSuccess }) => {
  const [method, setMethod] = useState('UPI');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [notes, setNotes] = useState('');

  if (!invoice) return null;

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);
      const res = await api.post('/payments', {
        invoice_id: invoice.id,
        amount: invoice.total_amount,
        payment_method: method,
        notes: notes || `Direct portal settlement via ${method}`
      });

      setReceipt(res.data.payment);
      if (onPaymentSuccess) {
        onPaymentSuccess(res.data.payment);
      }
    } catch (err) {
      alert('Payment processing failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-300">
              Secure Checkout Gateway
            </span>
            <h3 className="text-xl font-bold mt-1">Pay Invoice {invoice.invoice_number}</h3>
            <p className="text-xs text-slate-300 mt-0.5">Customer: {invoice.customer_name || 'Client'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {receipt ? (
          /* Payment Success Receipt View */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900">Payment Successful!</h4>
              <p className="text-xs text-slate-500 mt-1">Transaction reference: <span className="font-mono font-semibold text-slate-700">{receipt.transactionRef}</span></p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-semibold text-slate-800">{receipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-indigo-700 text-sm">₹{receipt.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-800">{receipt.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-700">{receipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-600">Settled (Paid)</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-sm"
            >
              Done & Return
            </button>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handlePay} className="p-6 space-y-5">
            {/* Amount Banner */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex justify-between items-center">
              <div>
                <span className="text-xs text-indigo-700 font-medium">Total Payable Amount</span>
                <div className="text-2xl font-black text-slate-900">₹{Number(invoice.total_amount).toLocaleString()}</div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg">
                Due: {invoice.due_date}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                  { id: 'Credit Card', label: 'Credit Card', icon: CreditCard },
                  { id: 'Net Banking', label: 'Net Banking', icon: Building2 },
                  { id: 'Bank Transfer', label: 'NEFT / RTGS', icon: Banknote },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = method === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setMethod(item.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                        active
                          ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulated Method Details */}
            {method === 'UPI' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Merchant UPI ID:</span>
                  <span className="font-mono font-bold text-slate-800">brightloop@icici</span>
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Instant auto-confirmation via NPCI switch
                </div>
              </div>
            )}

            {method === 'Credit Card' && (
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Number (Simulated)</label>
                  <input
                    type="text"
                    defaultValue="4242 •••• •••• 4242"
                    readOnly
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Expiry</label>
                    <input type="text" defaultValue="12/28" readOnly className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">CVV</label>
                    <input type="password" defaultValue="•••" readOnly className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-slate-700" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Notes / Remark (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Cleared by Rahul on Oct 31"
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            {/* Pay Button */}
            <button
              type="submit"
              disabled={processing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-brand-600 text-white font-bold text-xs uppercase tracking-wider hover:from-indigo-700 hover:to-brand-700 transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
            >
              {processing ? (
                <span>Simulating Gateway Processing...</span>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirm & Pay ₹{Number(invoice.total_amount).toLocaleString()}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
