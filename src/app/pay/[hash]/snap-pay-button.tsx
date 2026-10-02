"use client";

import { useState } from "react";
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

interface SnapPayButtonProps {
  paymentToken: string | null;
  invoiceNumber: string;
  isPaid: boolean;
  isExpired: boolean;
}

export function SnapPayButton({
  paymentToken,
  invoiceNumber,
  isPaid,
  isExpired,
}: SnapPayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (isPaid) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-800">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <span className="text-sm font-medium">
          Tagihan ini telah lunas. Terima kasih atas pembayaran Anda!
        </span>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <span className="text-sm font-medium">
          Masa berlaku tagihan ini telah berakhir. Silakan hubungi penerbit tagihan untuk invoice baru.
        </span>
      </div>
    );
  }

  const handlePay = () => {
    if (!paymentToken) {
      alert("Token pembayaran belum tersedia. Silakan hubungi admin merchant.");
      return;
    }

    if (typeof window === "undefined" || !window.snap) {
      alert("Modul pembayaran Midtrans sedang dimuat. Silakan coba kembali dalam beberapa detik.");
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    window.snap.pay(paymentToken, {
      onSuccess: () => {
        setLoading(false);
        setStatusMessage("Pembayaran berhasil diproses! Memperbarui halaman...");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      },
      onPending: () => {
        setLoading(false);
        setStatusMessage("Menunggu penyelesaian pembayaran via Virtual Account / QRIS.");
      },
      onError: (err) => {
        setLoading(false);
        console.error("Snap payment error:", err);
        setStatusMessage("Pembayaran gagal atau dibatalkan. Silakan coba lagi.");
      },
      onClose: () => {
        setLoading(false);
      },
    });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading || !paymentToken}
        aria-label={`Bayar invoice ${invoiceNumber} sekarang`}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-primary hover:bg-slate-800 active:bg-slate-950 text-white font-medium text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Membuka Gerbang Pembayaran...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>Bayar Sekarang (QRIS / Virtual Account)</span>
          </>
        )}
      </button>

      {statusMessage && (
        <p className="text-xs text-center text-slate-600 font-medium animate-fade-in">
          {statusMessage}
        </p>
      )}

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
        <span>🔒 Pembayaran aman & terenkripsi oleh Midtrans Snap</span>
      </div>
    </div>
  );
}
