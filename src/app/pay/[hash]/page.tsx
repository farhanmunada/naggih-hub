import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { invoices, invoiceItems, clients, merchants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { SnapPayButton } from "./snap-pay-button";
import {
  Calendar,
  Building2,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    hash: string;
  }>;
}

export default async function InvoicePaymentPage({ params }: PageProps) {
  const { hash } = await params;

  if (!hash) {
    notFound();
  }

  // Fetch invoice, client, merchant, and items
  const invoiceRecords = await db
    .select({
      invoice: invoices,
      client: clients,
      merchant: merchants,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .innerJoin(merchants, eq(invoices.merchantId, merchants.id))
    .where(eq(invoices.publicHash, hash))
    .limit(1);

  if (invoiceRecords.length === 0) {
    notFound();
  }

  const { invoice, client, merchant } = invoiceRecords[0];

  // Fetch itemized breakdown
  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoice.id));

  const isPaid = invoice.status === "PAID";
  const isExpired = invoice.status === "EXPIRED";

  return (
    <div className="min-h-screen py-8 sm:py-16 px-4 bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Main Clean Card Container */}
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          {/* Header Bar */}
          <div className="p-6 sm:p-8 border-b border-border bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Receipt className="w-5 h-5 text-slate-800" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tagihan Pembayaran
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {invoice.invoiceNumber}
              </h1>
            </div>

            {/* Status Badge */}
            <div>
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  LUNAS
                </span>
              ) : isExpired ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  KEDALUWARSA
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  MENUNGGU PEMBAYARAN
                </span>
              )}
            </div>
          </div>

          {/* Parties & Dates Meta Section */}
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-border bg-slate-50/50 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Diterbitkan Oleh:
              </p>
              <div className="space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  {merchant.businessName}
                </p>
                <p className="text-muted-foreground text-xs">{merchant.email}</p>
                <p className="text-muted-foreground text-xs">{merchant.phoneWa}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Ditagihkan Kepada:
              </p>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{client.name}</p>
                <p className="text-muted-foreground text-xs">{client.phoneWa}</p>
                {client.email && (
                  <p className="text-muted-foreground text-xs">{client.email}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-border flex flex-wrap gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Tanggal Terbit: {formatDateIndo(invoice.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <Clock className="w-3.5 h-3.5" />
                <span>Jatuh Tempo: {formatDateIndo(invoice.dueDate)}</span>
              </div>
              {invoice.paidAt && (
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Dibayar Pada: {formatDateIndo(invoice.paidAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="p-6 sm:p-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Rincian Tagihan
            </h2>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Deskripsi</th>
                    <th scope="col" className="px-4 py-3 font-medium text-center">Jumlah</th>
                    <th scope="col" className="px-4 py-3 font-medium text-right">Harga Satuan</th>
                    <th scope="col" className="px-4 py-3 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5 text-foreground font-medium">{item.description}</td>
                      <td className="px-4 py-3.5 text-muted-foreground text-center">{item.quantity}</td>
                      <td className="px-4 py-3.5 text-muted-foreground text-right">{formatRupiah(item.unitPrice)}</td>
                      <td className="px-4 py-3.5 text-foreground font-medium text-right">{formatRupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                        <FileText className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        Tidak ada rincian butir tagihan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Highlight */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-slate-50 border border-border">
              <span className="text-sm font-semibold text-slate-700">Total Yang Harus Dibayar:</span>
              <span className="text-2xl font-bold tracking-tight text-slate-950 mt-1 sm:mt-0 font-mono">
                {formatRupiah(invoice.totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Action Footer */}
          <div className="p-6 sm:p-8 bg-slate-50 border-t border-border">
            <SnapPayButton
              paymentToken={invoice.paymentToken}
              invoiceNumber={invoice.invoiceNumber}
              isPaid={isPaid}
              isExpired={isExpired}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
