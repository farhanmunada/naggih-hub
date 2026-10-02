"use client";

import { useState } from "react";
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { formatRupiah, formatDateIndo } from "@/lib/utils";

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  publicHash: string;
  totalAmount: string;
  dueDate: string;
  status: string;
  paidAt: Date | string | null;
  createdAt: Date | string;
  client: {
    id: string;
    name: string;
    phoneWa: string;
    email: string | null;
  };
}

interface InvoiceTableProps {
  initialInvoices: InvoiceRecord[];
  appUrl: string;
}

export function InvoiceTable({ initialInvoices, appUrl }: InvoiceTableProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredInvoices = initialInvoices.filter((inv) => {
    const matchesStatus =
      filterStatus === "ALL" ? true : inv.status === filterStatus;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.client.name.toLowerCase().includes(query) ||
      inv.client.phoneWa.includes(query);

    return matchesStatus && matchesSearch;
  });

  const handleCopyLink = (inv: InvoiceRecord) => {
    const url = `${appUrl}/pay/${inv.publicHash}`;
    navigator.clipboard.writeText(url);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getWaDirectLink = (inv: InvoiceRecord) => {
    let clean = inv.client.phoneWa.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.slice(1);
    const payUrl = `${appUrl}/pay/${inv.publicHash}`;
    const text = `Halo Kak ${inv.client.name}, ini pengingat tagihan no. ${
      inv.invoiceNumber
    } sejumlah ${formatRupiah(inv.totalAmount)} jatuh tempo pada ${formatDateIndo(
      inv.dueDate
    )}. Pembayaran online: ${payUrl}`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Table Toolbar & Filters */}
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: "Semua", value: "ALL" },
            { label: "Menunggu", value: "PENDING" },
            { label: "Lunas", value: "PAID" },
            { label: "Kedaluwarsa", value: "EXPIRED" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilterStatus(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filterStatus === tab.value
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Cari invoice / klien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-border text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-5 py-3.5 font-medium">
                No. Invoice
              </th>
              <th scope="col" className="px-5 py-3.5 font-medium">
                Klien
              </th>
              <th scope="col" className="px-5 py-3.5 font-medium">
                Jatuh Tempo
              </th>
              <th scope="col" className="px-5 py-3.5 font-medium text-right">
                Total Nominal
              </th>
              <th scope="col" className="px-5 py-3.5 font-medium text-center">
                Status
              </th>
              <th scope="col" className="px-5 py-3.5 font-medium text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredInvoices.map((inv) => {
              const isPaid = inv.status === "PAID";
              const isExpired = inv.status === "EXPIRED";

              return (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Invoice Number */}
                  <td className="px-5 py-4 font-mono font-semibold text-xs text-foreground">
                    <a
                      href={`/pay/${inv.publicHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline flex items-center gap-1.5"
                    >
                      <span>{inv.invoiceNumber}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 opacity-60" />
                    </a>
                  </td>

                  {/* Client Info */}
                  <td className="px-5 py-4">
                    <p className="font-medium text-xs text-foreground">
                      {inv.client.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {inv.client.phoneWa}
                    </p>
                  </td>

                  {/* Due Date */}
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {formatDateIndo(inv.dueDate)}
                  </td>

                  {/* Total Amount */}
                  <td className="px-5 py-4 text-right font-mono font-semibold text-xs text-slate-900">
                    {formatRupiah(inv.totalAmount)}
                  </td>

                  {/* Status Badge */}
                  <td className="px-5 py-4 text-center">
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        LUNAS
                      </span>
                    ) : isExpired ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <AlertCircle className="w-3 h-3" />
                        KEDALUWARSA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        PENDING
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {/* Copy Link */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(inv)}
                        title="Salin Link Pembayaran"
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        aria-label="Salin link bayar"
                      >
                        {copiedId === inv.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {/* WhatsApp Reminder (for PENDING status) */}
                      {!isPaid && (
                        <a
                          href={getWaDirectLink(inv)}
                          target="_blank"
                          rel="noreferrer"
                          title="Kirim Pengingat WhatsApp"
                          className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                          aria-label="Kirim WA"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}

                      {/* View Link */}
                      <a
                        href={`/pay/${inv.publicHash}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Buka Halaman Pembayaran"
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                        aria-label="Buka halaman bayar"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="text-sm font-medium text-foreground">
                    Tidak ada tagihan ditemukan
                  </p>
                  <p className="text-xs mt-0.5">
                    {searchQuery
                      ? "Coba ubah kata kunci pencarian Anda."
                      : "Mulai buat invoice pertama Anda dengan tombol di atas."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
