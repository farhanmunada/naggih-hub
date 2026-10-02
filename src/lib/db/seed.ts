import { db } from "./index";
import { merchants, clients, invoices, invoiceItems } from "./schema";

export async function seedDemoData() {
  console.log("Seeding demo data for NagihHub...");

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

  const [invoice] = await db
    .insert(invoices)
    .values({
      merchantId: merchant.id,
      clientId: client.id,
      invoiceNumber: "INV/202610/0001",
      publicHash: "demo-hash",
      totalAmount: "1750000.00",
      dueDate: dueDate.toISOString().split("T")[0],
      status: "PENDING",
      paymentToken: "demo-snap-token-12345",
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
