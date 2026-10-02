import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, paymentLogs, clients, merchants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyMidtransSignature,
  isPaymentSuccessful,
  MidtransWebhookPayload,
} from "@/lib/midtrans";
import {
  sendWhatsAppMessage,
  formatPaymentSuccessMessage,
} from "@/lib/whatsapp";
import { formatRupiah, formatDateIndo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body: MidtransWebhookPayload = await req.json();

    // 1. Verify Midtrans SHA-512 Signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const isValidSignature = verifyMidtransSignature(
      {
        order_id: body.order_id,
        status_code: body.status_code,
        gross_amount: body.gross_amount,
        signature_key: body.signature_key,
      },
      serverKey
    );

    if (!isValidSignature) {
      console.warn("[Webhook] Invalid signature received for order:", body.order_id);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // 2. Fetch Target Invoice with Client & Merchant relations
    const invoiceList = await db
      .select({
        invoice: invoices,
        client: clients,
        merchant: merchants,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .innerJoin(merchants, eq(invoices.merchantId, merchants.id))
      .where(eq(invoices.invoiceNumber, body.order_id))
      .limit(1);

    if (invoiceList.length === 0) {
      console.warn("[Webhook] Invoice not found:", body.order_id);
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const { invoice, client, merchant } = invoiceList[0];

    // 3. Idempotency Guard: if already PAID, return 200 immediately
    if (invoice.status === "PAID") {
      return NextResponse.json(
        { message: "Invoice already marked as PAID. Skipped redundant processing." },
        { status: 200 }
      );
    }

    // 4. Record Payment Audit Log
    const gatewayRef = `${body.order_id}:${body.transaction_id || Date.now()}`;
    try {
      await db.insert(paymentLogs).values({
        invoiceId: invoice.id,
        gatewayReference: gatewayRef,
        paymentType: body.payment_type || "unknown",
        rawPayload: body,
        status: body.transaction_status,
      });
    } catch (logErr: unknown) {
      // If unique constraint violation on gatewayReference, treat as duplicate delivery
      console.warn("[Webhook] Duplicate gateway reference logged:", gatewayRef);
      return NextResponse.json({ message: "Duplicate event acknowledged" }, { status: 200 });
    }

    // 5. Evaluate Payment Status
    if (isPaymentSuccessful(body)) {
      const now = new Date();

      // Mutate state to PAID
      await db
        .update(invoices)
        .set({
          status: "PAID",
          paidAt: now,
        })
        .where(eq(invoices.id, invoice.id));

      // Side Effect: Trigger WhatsApp Receipt Notification
      if (client.phoneWa) {
        const message = formatPaymentSuccessMessage({
          clientName: client.name,
          merchantName: merchant.businessName,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: formatRupiah(invoice.totalAmount),
          paymentType: body.payment_type || "QRIS/VA",
          paidAt: formatDateIndo(now),
        });

        // Non-blocking dispatch
        sendWhatsAppMessage({
          to: client.phoneWa,
          message,
        }).catch((err) => {
          console.error("[Webhook] Failed to dispatch WhatsApp receipt:", err);
        });
      }
    } else if (
      body.transaction_status === "expire" ||
      body.transaction_status === "cancel"
    ) {
      await db
        .update(invoices)
        .set({ status: "EXPIRED" })
        .where(eq(invoices.id, invoice.id));
    }

    return NextResponse.json(
      { success: true, status: body.transaction_status },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Webhook] Internal error processing Midtrans webhook:", errorMsg);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
