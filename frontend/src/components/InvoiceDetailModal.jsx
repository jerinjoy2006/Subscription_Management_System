import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Mail,
  CreditCard,
  CheckCircle,
  Clock,
  Layers,
  FileText
} from 'lucide-react';
import api from '../api/client';

export const InvoiceDetailModal = ({ invoiceId, onClose, onPayClick, onInvoiceUpdated }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${invoiceId}`);
        setInvoice(res.data.invoice);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (invoiceId) fetchInvoice();
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  const handleSend = async () => {
    try {
      setSending(true);
      const res = await api.post(`/invoices/${invoiceId}/send`);
      setMessage(res.data.message);
      if (onInvoiceUpdated) onInvoiceUpdated();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      alert('Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  if (!invoiceId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-scale-up">
        {/* Actions Bar (hidden in print) */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold tracking-tight">Invoice Details — {invoice?.invoice_number}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>

            <button
              onClick={handleSend}
              disabled={sending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              {sending ? 'Sending...' : 'Email Invoice'}
            </button>

            {invoice && invoice.status !== 'Paid' && onPayClick && (
              <button
                onClick={() => onPayClick(invoice)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Pay Now
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-medium border-b border-emerald-100 flex justify-between items-center print:hidden">
            <span>{message}</span>
            <button onClick={() => setMessage(null)} className="font-bold">✕</button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading invoice...</div>
        ) : invoice ? (
          /* Printable Invoice Canvas */
          <div id="printable-invoice" className="p-8 space-y-6 text-slate-800">
            {/* Top Brand Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-xl font-black text-slate-900 tracking-tight">Brightloop Software</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">SaaS & Enterprise Business Systems</p>
                <p className="text-xs text-slate-500">GSTIN: 27AABCB1234M1Z5 | billing@brightloop.com</p>
              </div>

              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2 ${
                  invoice.status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : invoice.status === 'Confirmed'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {invoice.status}
                </span>
                <h2 className="text-xl font-bold text-slate-900">{invoice.invoice_number}</h2>
                <p className="text-xs text-slate-500">Issued: {invoice.issue_date}</p>
                <p className="text-xs font-semibold text-rose-600">Due: {invoice.due_date}</p>
              </div>
            </div>

            {/* Bill To & Terms */}
            <div className="grid grid-cols-2 gap-8 text-xs">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400">Billed To:</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{invoice.customer_name}</div>
                <div className="text-slate-600">{invoice.company_name || 'Individual Account'}</div>
                <div className="text-slate-500">{invoice.customer_email}</div>
                {invoice.customer_phone && <div className="text-slate-500">{invoice.customer_phone}</div>}
              </div>

              <div className="text-right space-y-1">
                <div>
                  <span className="text-slate-400">Subscription Ref: </span>
                  <span className="font-bold text-slate-800">{invoice.subscription_number}</span>
                </div>
                <div>
                  <span className="text-slate-400">Billing Period: </span>
                  <span className="text-slate-700 font-medium">{invoice.billing_period_start} to {invoice.billing_period_end}</span>
                </div>
                <div>
                  <span className="text-slate-400">Payment Terms: </span>
                  <span className="text-slate-700 font-semibold">{invoice.payment_terms || 'Immediate'}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Item & Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Tax Rate</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items?.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{it.product_name}</div>
                        {it.variant_name && (
                          <span className="text-[11px] text-indigo-600 font-medium">
                            Variant: {it.variant_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-700">{it.quantity}</td>
                      <td className="py-3 px-3 text-right text-slate-600">₹{Number(it.unit_price).toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-slate-600">{it.tax_rate}%</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">₹{Number(it.line_total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Breakdown */}
            <div className="flex justify-end text-xs">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">₹{Number(invoice.subtotal).toLocaleString()}</span>
                </div>

                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount Applied:</span>
                    <span>-₹{Number(invoice.discount_amount).toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Taxes (GST/VAT):</span>
                  <span className="font-semibold text-slate-800">₹{Number(invoice.tax_amount).toLocaleString()}</span>
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600">₹{Number(invoice.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Record Section if Paid */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-200 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider block mb-2">Settlement Details</span>
                {invoice.payments.map((p, idx) => (
                  <div key={idx} className="bg-emerald-50/60 border border-emerald-200/80 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-emerald-900">{p.payment_number}</span>
                      <span className="text-slate-500 ml-2">via {p.payment_method} on {p.payment_date}</span>
                      <div className="text-[11px] font-mono text-slate-600">Ref: {p.transaction_ref}</div>
                    </div>
                    <span className="font-bold text-emerald-800 text-sm">₹{Number(p.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
              Thank you for choosing Brightloop Software! For billing inquiries, email support@brightloop.com
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
