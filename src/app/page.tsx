import Link from "next/link";
import {
  Receipt,
  CreditCard,
  BellRing,
  ShieldCheck,
  ArrowRight,
  Database,
  ExternalLink,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b border-border bg-surface sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
              N
            </div>
            <span className="font-bold tracking-tight text-lg text-foreground">
              NagihHub
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono border border-slate-200">
              v1.0 (Next.js + Neon DB)
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
          Otomatisasi Penagihan & Dunning UMKM
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          Hentikan Tagihan Manual. <br className="hidden sm:inline" />
          Koleksi Pembayaran Otomatis.
        </h1>

        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Gantikan invoice PDF WhatsApp manual dengan tautan bayar instan ber-enkripsi,
          rekonsiliasi QRIS & Virtual Account Midtrans, serta follow-up jatuh tempo terjadwal.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/pay/demo-hash"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
          >
            <span>Lihat Contoh Invoice Publik</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-border text-foreground font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            <span>Dokumentasi API</span>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-xl bg-surface border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 mb-4 border border-slate-200">
              <Receipt className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-foreground mb-1">Invoice Unik</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tautan publik aman berbasis SHA-256 hash dengan rincian item, nomor invoice, dan jatuh tempo.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 mb-4 border border-slate-200">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-foreground mb-1">Midtrans Snap</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dukungan checkout instan modal pop-up QRIS, BCA, BNI, Mandiri, dan BRI Virtual Account.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 mb-4 border border-slate-200">
              <BellRing className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-foreground mb-1">Dunning WhatsApp</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pengingat otomatis terkirim pada H-3, H-1, dan Day 0 melalui gateway Fonnte / WAHA dengan rate limit.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 mb-4 border border-slate-200">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-foreground mb-1">Neon DB & Drizzle</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Serverless PostgreSQL cepat dengan log audit idempotent untuk mencegah double billing webhook.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
