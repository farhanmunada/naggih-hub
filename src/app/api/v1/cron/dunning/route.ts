import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, clients, merchants } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  sendWhatsAppMessage,
  formatDunningMessage,
  sleep,
} from "@/lib/whatsapp";
import { formatRupiah, formatDateIndo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate Cron Request
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 2. Query PENDING Invoices due today, tomorrow (H-1), or in 3 days (H-3)
    // SQL: due_date IN (CURRENT_DATE, CURRENT_DATE + 1, CURRENT_DATE + 3)
    const pendingInvoices = await db
      .select({
        invoice: invoices,
        client: clients,
        merchant: merchants,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .innerJoin(merchants, eq(invoices.merchantId, merchants.id))
      .where(
        and(
          eq(invoices.status, "PENDING"),
          sql`${invoices.dueDate} IN (CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '3 days')`
        )
      );

    const results = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Process Reminders with Rate-Limiting Throttle
    for (const record of pendingInvoices) {
      const { invoice, client, merchant } = record;
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const daysRemaining = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

      const paymentUrl = `${appUrl}/pay/${invoice.publicHash}`;
      const message = formatDunningMessage({
        clientName: client.name,
        merchantName: merchant.businessName,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: formatRupiah(invoice.totalAmount),
        daysRemaining,
        dueDate: formatDateIndo(invoice.dueDate),
        paymentUrl,
      });

      const sendResult = await sendWhatsAppMessage({
        to: client.phoneWa,
        message,
      });

      results.push({
        invoiceNumber: invoice.invoiceNumber,
        clientPhone: client.phoneWa,
        daysRemaining,
        sent: sendResult.success,
        error: sendResult.error,
      });

      // Throttle 2 seconds between outbound messages
      await sleep(2000);
    }

    return NextResponse.json({
      success: true,
      processedCount: pendingInvoices.length,
      details: results,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Cron Dunning] Error executing dunning job:", errorMsg);
    return NextResponse.json(
      { error: "Internal error executing dunning scheduler" },
      { status: 500 }
    );
  }
}
