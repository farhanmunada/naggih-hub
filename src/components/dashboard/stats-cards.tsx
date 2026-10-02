import { formatRupiah } from "@/lib/utils";
import { CheckCircle2, Clock, FileText, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalPaid: number;
  totalPending: number;
  countPaid: number;
  countPending: number;
  countExpired: number;
  totalInvoices: number;
}

export function StatsCards({
  totalPaid,
  totalPending,
  countPaid,
  countPending,
  totalInvoices,
}: StatsCardsProps) {
  const successRate =
    totalInvoices > 0 ? Math.round((countPaid / totalInvoices) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Pendapatan Lunas */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Diterima
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {formatRupiah(totalPaid)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-semibold text-emerald-600 font-mono">
              {countPaid}
            </span>{" "}
            invoice lunas terverifikasi
          </p>
        </div>
      </div>

      {/* 2. Menunggu Pembayaran (Piutang) */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Menunggu Bayar
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {formatRupiah(totalPending)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-semibold text-amber-600 font-mono">
              {countPending}
            </span>{" "}
            invoice aktif dalam penagihan
          </p>
        </div>
      </div>

      {/* 3. Total Invoice */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Tagihan
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {totalInvoices}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Semua tagihan diterbitkan
          </p>
        </div>
      </div>

      {/* 4. Tingkat Sukses Pelunasan */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tingkat Pelunasan
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {successRate}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Rasio invoice lunas / total
          </p>
        </div>
      </div>
    </div>
  );
}
