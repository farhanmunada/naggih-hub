import { db } from "@/lib/db";
import { invoices, clients, merchants } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { InvoiceTable, InvoiceRecord } from "@/components/dashboard/invoice-table";
import { CreateInvoiceModal } from "@/components/dashboard/create-invoice-modal";
import { Building2, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Fetch Merchants
  const [currentMerchant] = await db.select().from(merchants).limit(1);

  // 2. Fetch Clients for dropdown
  const allClients = await db
    .select({
      id: clients.id,
      name: clients.name,
      phoneWa: clients.phoneWa,
      email: clients.email,
    })
    .from(clients)
    .orderBy(desc(clients.createdAt));

  // 3. Fetch Invoices with client relation
  const rawInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      publicHash: invoices.publicHash,
      totalAmount: invoices.totalAmount,
      dueDate: invoices.dueDate,
      status: invoices.status,
      paidAt: invoices.paidAt,
      createdAt: invoices.createdAt,
      client: {
        id: clients.id,
        name: clients.name,
        phoneWa: clients.phoneWa,
        email: clients.email,
      },
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(invoices.createdAt));

  // 4. Calculate Stats
  let totalPaid = 0;
  let totalPending = 0;
  let countPaid = 0;
  let countPending = 0;
  let countExpired = 0;

  for (const inv of rawInvoices) {
    const amount = parseFloat(inv.totalAmount) || 0;
    if (inv.status === "PAID") {
      totalPaid += amount;
      countPaid += 1;
    } else if (inv.status === "PENDING") {
      totalPending += amount;
      countPending += 1;
    } else if (inv.status === "EXPIRED") {
      countExpired += 1;
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
                N
              </div>
              <div>
                <span className="font-bold tracking-tight text-sm text-foreground block leading-tight">
                  NagihHub
                </span>
                <span className="text-[10px] text-muted-foreground block leading-tight">
                  Dashboard Penagihan
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentMerchant && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold">{currentMerchant.businessName}</span>
              </div>
            )}
            <CreateInvoiceModal existingClients={allClients} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Ringkasan Penagihan
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Pantau status pembayaran faktur dan kirim tagihan WhatsApp secara instan.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <StatsCards
          totalPaid={totalPaid}
          totalPending={totalPending}
          countPaid={countPaid}
          countPending={countPending}
          countExpired={countExpired}
          totalInvoices={rawInvoices.length}
        />

        {/* Invoices Table Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">
              Daftar Semua Tagihan ({rawInvoices.length})
            </h2>
          </div>

          <InvoiceTable
            initialInvoices={rawInvoices as InvoiceRecord[]}
            appUrl={appUrl}
          />
        </div>
      </main>
    </div>
  );
}
