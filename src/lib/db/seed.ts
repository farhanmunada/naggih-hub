import { db } from "./index";
import { merchants, clients, invoices, invoiceItems } from "./schema";
import { createSnapToken } from "../midtrans";
import { eq } from "drizzle-orm";

export async function seedDemoData() {
  console.log("Seeding demo data for NagihHub...");

  // Clean existing demo data for idempotency
  await db
    .delete(merchants)
    .where(eq(merchants.email, "billing@studiokreatif.id"));

  // 1. Create Demo Merchant
  const [merchant] = await db
    .insert(merchants)
    .values({
      businessName: "Studio Kreatif Nusantara",
      email: "billing@studiokreatif.id",
      phoneWa: "6281234567890",
    })
    .returning();

  console.log("Created Merchant:", merchant.businessName);

  // 2. Create Demo Client
  const [client] = await db
    .insert(clients)
    .values({
      merchantId: merchant.id,
      name: "Budi Santoso",
      phoneWa: "6289876543210",
      email: "budi@santoso.com",
    })
    .returning();

  console.log("Created Client:", client.name);

  // 3. Create Demo Invoice
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3); // Due in 3 days

  const invoiceNumber = `INV/${new Date().getFullYear()}${String(
    new Date().getMonth() + 1
  ).padStart(2, "0")}/${Date.now().toString().slice(-4)}`;

  const totalAmount = 1750000;
  let paymentToken = "demo-snap-token-12345";

  // Request actual Midtrans Snap token if MIDTRANS_SERVER_KEY is configured
  if (
    process.env.MIDTRANS_SERVER_KEY &&
    !process.env.MIDTRANS_SERVER_KEY.includes("xxxxxxxxxxxx")
  ) {
    try {
      const snapRes = await createSnapToken({
        orderId: invoiceNumber,
        grossAmount: totalAmount,
        items: [
          {
            id: "item-1",
            name: "Jasa Redesign Landing Page Website",
            price: 1500000,
            quantity: 1,
          },
          {
            id: "item-2",
            name: "Setup Domain kustom & DNS Protection",
            price: 250000,
            quantity: 1,
          },
        ],
        customer: {
          first_name: client.name,
          email: client.email || undefined,
          phone: client.phoneWa,
        },
      });
      paymentToken = snapRes.token;
      console.log("Generated live Midtrans Snap Token:", paymentToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("Could not request Midtrans token, using fallback:", msg);
    }
  }

  const [invoice] = await db
    .insert(invoices)
    .values({
      merchantId: merchant.id,
      clientId: client.id,
      invoiceNumber,
      publicHash: "demo-hash",
      totalAmount: totalAmount.toFixed(2),
      dueDate: dueDate.toISOString().split("T")[0],
      status: "PENDING",
      paymentToken,
    })
    .returning();

  console.log("Created Invoice:", invoice.invoiceNumber);

  // 4. Create Items
  await db.insert(invoiceItems).values([
    {
      invoiceId: invoice.id,
      description: "Jasa Redesign Landing Page Website (Figma to Code)",
      quantity: 1,
      unitPrice: "1500000.00",
      subtotal: "1500000.00",
    },
    {
      invoiceId: invoice.id,
      description: "Setup Domain kustom & Cloudflare DNS Protection",
      quantity: 1,
      unitPrice: "250000.00",
      subtotal: "250000.00",
    },
  ]);

  console.log("Seeding complete! Access demo invoice at: /pay/demo-hash");
}

if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding error:", err);
      process.exit(1);
    });
}
