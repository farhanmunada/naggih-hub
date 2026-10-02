import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, invoiceItems, clients, merchants } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  generateInvoiceNumber,
  generatePublicHash,
  formatRupiah,
  formatDateIndo,
} from "@/lib/utils";
import { createSnapToken } from "@/lib/midtrans";
import { sendWhatsAppMessage, formatNewInvoiceMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export interface CreateInvoiceRequestBody {
  merchantId: string;
  clientId: string;
  dueDate: string; // YYYY-MM-DD
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateInvoiceRequestBody = await req.json();

    if (!body.merchantId || !body.clientId || !body.dueDate || !body.items?.length) {
      return NextResponse.json(
        { error: "Missing required invoice fields (merchantId, clientId, dueDate, items)" },
        { status: 400 }
      );
    }

    // 1. Fetch Merchant and Client
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, body.merchantId))
      .limit(1);

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, body.clientId))
      .limit(1);

    if (!merchant || !client) {
      return NextResponse.json(
        { error: "Merchant or Client not found" },
        { status: 404 }
      );
    }

    // 2. Calculate Items Subtotals and Total Amount
    let total = 0;
    const computedItems = body.items.map((item) => {
      const qty = Math.max(1, item.quantity);
      const price = Math.max(0, item.unitPrice);
      const subtotal = qty * price;
      total += subtotal;
      return {
        description: item.description,
        quantity: qty,
        unitPrice: price.toFixed(2),
        subtotal: subtotal.toFixed(2),
      };
    });

    // 3. Generate Sequence & Invoice Number
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(eq(invoices.merchantId, merchant.id));

    const sequence = (countResult[0]?.count || 0) + 1;
    const invoiceNumber = generateInvoiceNumber(sequence);
    const publicHash = generatePublicHash();

    // 4. Request Midtrans Snap Token (Sandbox)
    let paymentToken: string | null = null;
    try {
      if (process.env.MIDTRANS_SERVER_KEY) {
        const snapRes = await createSnapToken({
          orderId: invoiceNumber,
          grossAmount: total,
          items: computedItems.map((item, idx) => ({
            id: `item-${idx + 1}`,
            name: item.description,
            price: parseFloat(item.unitPrice),
            quantity: item.quantity,
          })),
          customer: {
            first_name: client.name,
            email: client.email || undefined,
            phone: client.phoneWa,
          },
        });
        paymentToken = snapRes.token;
      }
    } catch (snapErr) {
      console.warn("[Invoice] Midtrans token generation skipped or failed:", snapErr);
    }

    // 5. Insert Invoice & Items into DB
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        merchantId: merchant.id,
        clientId: client.id,
        invoiceNumber,
        publicHash,
        totalAmount: total.toFixed(2),
        dueDate: body.dueDate,
        status: "PENDING",
        paymentToken,
      })
      .returning();

    if (computedItems.length > 0) {
      await db.insert(invoiceItems).values(
        computedItems.map((item) => ({
          invoiceId: newInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        }))
      );
    }

    // 6. Dispatch WhatsApp notification to client
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const paymentUrl = `${appUrl}/pay/${publicHash}`;

    if (client.phoneWa) {
      const message = formatNewInvoiceMessage({
        clientName: client.name,
        merchantName: merchant.businessName,
        invoiceNumber,
        totalAmount: formatRupiah(total),
        dueDate: formatDateIndo(body.dueDate),
        paymentUrl,
      });

      sendWhatsAppMessage({
        to: client.phoneWa,
        message,
      }).catch((err) => {
        console.error("[Invoice] WhatsApp dispatch error:", err);
      });
    }

    return NextResponse.json(
      {
        success: true,
        invoice: {
          ...newInvoice,
          paymentUrl,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Invoice] Failed to create invoice:", errorMsg);
    return NextResponse.json(
      { error: "Internal server error creating invoice" },
      { status: 500 }
    );
  }
}
