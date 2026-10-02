export interface SendWhatsAppParams {
  to: string; // phone number (e.g. 08123456789 or 628123456789)
  message: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Format local Indonesian phone number to international standard (628xxx)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

/**
 * Format WhatsApp template for New Invoice
 */
export function formatNewInvoiceMessage(params: {
  clientName: string;
  merchantName: string;
  invoiceNumber: string;
  totalAmount: string;
  dueDate: string;
  paymentUrl: string;
}): string {
  return `Halo Kak ${params.clientName},

Tagihan baru dari *${params.merchantName}* telah diterbitkan:

📄 No. Invoice: *${params.invoiceNumber}*
💰 Total Tagihan: *${params.totalAmount}*
🗓️ Jatuh Tempo: *${params.dueDate}*

Klik tautan berikut untuk melihat rincian dan melakukan pembayaran via QRIS / Virtual Account:
👉 ${params.paymentUrl}

Terima kasih.`;
}

/**
 * Format WhatsApp template for Payment Success Receipt
 */
export function formatPaymentSuccessMessage(params: {
  clientName: string;
  merchantName: string;
  invoiceNumber: string;
  totalAmount: string;
  paymentType: string;
  paidAt: string;
}): string {
  return `✅ *PEMBAYARAN DITERIMA*

Halo Kak ${params.clientName},
Pembayaran tagihan Anda kepada *${params.merchantName}* telah berhasil dikonfirmasi lunas.

📄 No. Invoice: *${params.invoiceNumber}*
💰 Jumlah: *${params.totalAmount}*
💳 Metode: *${params.paymentType.toUpperCase()}*
⏰ Waktu: *${params.paidAt}*

Status tagihan Anda kini: *LUNAS (PAID)*.
Terima kasih atas kerjasamanya! 🙏`;
}

/**
 * Format WhatsApp template for Dunning Reminder
 */
export function formatDunningMessage(params: {
  clientName: string;
  merchantName: string;
  invoiceNumber: string;
  totalAmount: string;
  daysRemaining: number; // 0 for today, 1 for tomorrow, 3 for 3 days
  dueDate: string;
  paymentUrl: string;
}): string {
  let reminderLabel = `jatuh tempo dalam *${params.daysRemaining} hari* (${params.dueDate})`;
  if (params.daysRemaining === 0) {
    reminderLabel = `*JATUH TEMPO HARI INI* (${params.dueDate})`;
  } else if (params.daysRemaining === 1) {
    reminderLabel = `jatuh tempo *BESOK* (${params.dueDate})`;
  }

  return `Halo Kak ${params.clientName},

Pengingat ramah untuk tagihan Anda dari *${params.merchantName}* yang akan ${reminderLabel}:

📄 No. Invoice: *${params.invoiceNumber}*
💰 Total Tagihan: *${params.totalAmount}*

Mohon lakukan pembayaran sebelum jatuh tempo melalui tautan aman berikut:
👉 ${params.paymentUrl}

Abaikan pesan ini jika sudah melakukan pembayaran. Terima kasih.`;
}

/**
 * Send WhatsApp notification via configured gateway (Fonnte / WAHA)
 */
export async function sendWhatsAppMessage(
  params: SendWhatsAppParams
): Promise<WhatsAppSendResult> {
  const provider = (process.env.WHATSAPP_GATEWAY_PROVIDER || "fonnte").toLowerCase();
  const token = process.env.WHATSAPP_API_TOKEN || "";
  const formattedPhone = formatPhoneNumber(params.to);

  if (!token) {
    console.warn("[WhatsApp] WHATSAPP_API_TOKEN not configured. Skipping send.");
    return { success: false, error: "WHATSAPP_API_TOKEN is not set" };
  }

  try {
    if (provider === "waha") {
      const wahaUrl = process.env.WHATSAPP_API_URL || "http://localhost:3000/api/sendText";
      const res = await fetch(wahaUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": token,
        },
        body: JSON.stringify({
          chatId: `${formattedPhone}@c.us`,
          text: params.message,
          session: "default",
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { success: false, error: `WAHA Error: ${errorText}` };
      }
      return { success: true };
    } else {
      // Default: Fonnte API
      const fonnteUrl = process.env.WHATSAPP_API_URL || "https://api.fonnte.com/send";
      const formData = new FormData();
      formData.append("target", formattedPhone);
      formData.append("message", params.message);
      formData.append("countryCode", "62");

      const res = await fetch(fonnteUrl, {
        method: "POST",
        headers: {
          Authorization: token,
        },
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || (data && data.status === false)) {
        return {
          success: false,
          error: data?.reason || `Fonnte Error (${res.status})`,
        };
      }
      return { success: true, messageId: data?.id?.[0] };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[WhatsApp] Failed to send message:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Throttle helper to respect gateway rate limits
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
