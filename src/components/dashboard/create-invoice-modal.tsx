"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  X,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Loader2,
  FilePlus,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface ClientOption {
  id: string;
  name: string;
  phoneWa: string;
  email: string | null;
}

interface CreateInvoiceModalProps {
  existingClients: ClientOption[];
  onInvoiceCreated?: () => void;
}

interface ItemRow {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function CreateInvoiceModal({
  existingClients,
  onInvoiceCreated,
}: CreateInvoiceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Client Selection Mode
  const [clientMode, setClientMode] = useState<"new" | "existing">("new");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // New Client Form Fields
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Invoice Details
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  };
  const [dueDate, setDueDate] = useState(defaultDueDate());

  // Dynamic Line Items
  const [items, setItems] = useState<ItemRow[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  // Created Invoice Result
  const [createdResult, setCreatedResult] = useState<{
    invoiceNumber: string;
    publicHash: string;
    paymentUrl: string;
    totalAmount: string;
    clientPhone: string;
    clientName: string;
  } | null>(null);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof ItemRow,
    value: string | number
  ) => {
    const updated = [...items];
    if (field === "quantity") {
      updated[index].quantity = Math.max(1, Number(value) || 1);
    } else if (field === "unitPrice") {
      updated[index].unitPrice = Math.max(0, Number(value) || 0);
    } else {
      updated[index].description = String(value);
    }
    setItems(updated);
  };

  const grandTotal = items.reduce(
    (acc, item) => acc + item.quantity * item.unitPrice,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (clientMode === "new") {
      if (!clientName.trim() || !clientPhone.trim()) {
        alert("Nama klien dan nomor WhatsApp wajib diisi.");
        return;
      }
    } else {
      if (!selectedClientId) {
        alert("Pilih klien yang tersedia.");
        return;
      }
    }

    if (!dueDate) {
      alert("Tentukan tanggal jatuh tempo.");
      return;
    }

    const invalidItem = items.find(
      (item) => !item.description.trim() || item.unitPrice <= 0
    );
    if (invalidItem) {
      alert("Pastikan semua butir tagihan memiliki deskripsi dan harga.");
      return;
    }

    setLoading(true);

    try {
      const payload: {
        clientId?: string;
        client?: { name: string; phoneWa: string; email?: string };
        dueDate: string;
        items: ItemRow[];
      } = {
        dueDate,
        items,
      };

      if (clientMode === "new") {
        payload.client = {
          name: clientName.trim(),
          phoneWa: clientPhone.trim(),
          email: clientEmail.trim() || undefined,
        };
      } else {
        payload.clientId = selectedClientId;
      }

      const res = await fetch("/api/v1/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal membuat invoice");
      }

      const inv = data.invoice;
      const targetPhone =
        clientMode === "new"
          ? clientPhone.trim()
          : existingClients.find((c) => c.id === selectedClientId)?.phoneWa || "";
      const targetName =
        clientMode === "new"
          ? clientName.trim()
          : existingClients.find((c) => c.id === selectedClientId)?.name || "";

      setCreatedResult({
        invoiceNumber: inv.invoiceNumber,
        publicHash: inv.publicHash,
        paymentUrl: inv.paymentUrl,
        totalAmount: formatRupiah(inv.totalAmount),
        clientPhone: targetPhone,
        clientName: targetName,
      });

      setIsOpen(false);
      setIsSuccessOpen(true);

      // Reset form
      setClientName("");
      setClientPhone("");
      setClientEmail("");
      setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
      setDueDate(defaultDueDate());

      if (onInvoiceCreated) {
        onInvoiceCreated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Terjadi kesalahan: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatWaDirectUrl = (phone: string, text: string) => {
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.slice(1);
    return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-slate-800 text-white font-medium text-xs sm:text-sm transition-colors shadow-sm cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Buat Tagihan Baru</span>
      </button>

      {/* Main Creation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-border rounded-xl shadow-lg w-full max-w-2xl my-8 overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-slate-800" />
                <h2 className="text-base font-bold text-foreground">
                  Buat Tagihan Baru
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Client Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Tujuan Tagihan (Klien)
                </label>
                {existingClients.length > 0 && (
                  <div className="flex gap-4 mb-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="clientMode"
                        checked={clientMode === "new"}
                        onChange={() => setClientMode("new")}
                        className="text-primary focus:ring-slate-900"
                      />
                      <span>Klien Baru</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="clientMode"
                        checked={clientMode === "existing"}
                        onChange={() => setClientMode("existing")}
                        className="text-primary focus:ring-slate-900"
                      />
                      <span>Pilih Klien Tersimpan ({existingClients.length})</span>
                    </label>
                  </div>
                )}

                {clientMode === "existing" && existingClients.length > 0 ? (
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">-- Pilih Klien --</option>
                    {existingClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phoneWa})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Nama Lengkap Klien *"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Nomor WhatsApp (cth: 08123456789) *"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="email"
                        placeholder="Alamat Email (opsional)"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Tanggal Jatuh Tempo *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full sm:w-60 px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Rincian Item Tagihan *
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-slate-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-border"
                    >
                      <input
                        type="text"
                        placeholder="Deskripsi jasa / produk"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        required
                        className="flex-1 px-3 py-1.5 text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", e.target.value)
                          }
                          required
                          className="w-16 px-2 py-1.5 text-center text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                        />
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="Harga (Rp)"
                          value={item.unitPrice || ""}
                          onChange={(e) =>
                            updateItem(index, "unitPrice", e.target.value)
                          }
                          required
                          className="w-28 sm:w-32 px-2 py-1.5 text-right text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          aria-label="Hapus item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal summary */}
                <div className="mt-3 flex justify-between items-center p-3 rounded-lg bg-slate-100/70 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">
                    Total Tagihan:
                  </span>
                  <span className="text-lg font-bold font-mono text-slate-950">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Form Action */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-slate-800 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menerbitkan...</span>
                    </>
                  ) : (
                    <span>Terbitkan Tagihan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Dialog Modal */}
      {isSuccessOpen && createdResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white border border-border rounded-xl shadow-lg w-full max-w-md p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                Invoice Berhasil Diterbitkan! 🎉
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsSuccessOpen(false);
                  window.location.reload();
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                No. Invoice:{" "}
                <span className="font-semibold text-foreground font-mono">
                  {createdResult.invoiceNumber}
                </span>
              </p>
              <p>
                Total Nominal:{" "}
                <span className="font-semibold text-foreground font-mono">
                  {createdResult.totalAmount}
                </span>
              </p>
              <p>
                Ditagihkan ke:{" "}
                <span className="font-semibold text-foreground">
                  {createdResult.clientName} ({createdResult.clientPhone})
                </span>
              </p>
            </div>

            {/* Link Box */}
            <div className="p-3 bg-slate-50 rounded-lg border border-border space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Tautan Halaman Pembayaran Publik:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={createdResult.paymentUrl}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-border rounded font-mono text-slate-700 truncate select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdResult.paymentUrl)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-border rounded text-slate-700 cursor-pointer flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <a
                href={formatWaDirectUrl(
                  createdResult.clientPhone,
                  `Halo Kak ${createdResult.clientName}, berikut tagihan Anda no. ${createdResult.invoiceNumber} sebesar ${createdResult.totalAmount}. Pembayaran QRIS/Virtual Account: ${createdResult.paymentUrl}`
                )}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim Langsung ke WhatsApp Klien</span>
              </a>

              <a
                href={createdResult.paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-border hover:bg-slate-50 text-foreground font-medium text-xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Buka Tampilan Halaman Bayar</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
