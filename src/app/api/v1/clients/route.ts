import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, merchants } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allClients = await db
      .select()
      .from(clients)
      .orderBy(desc(clients.createdAt));

    return NextResponse.json({ success: true, data: allClients });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Clients API] Failed to fetch clients:", errorMsg);
    return NextResponse.json(
      { error: "Internal server error fetching clients" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.phoneWa) {
      return NextResponse.json(
        { error: "Missing required fields (name, phoneWa)" },
        { status: 400 }
      );
    }

    let merchantId = body.merchantId;
    if (!merchantId) {
      const [m] = await db.select().from(merchants).limit(1);
      if (m) {
        merchantId = m.id;
      } else {
        const [newM] = await db
          .insert(merchants)
          .values({
            businessName: "Bisnis Saya",
            email: "merchant@nagihhub.id",
            phoneWa: "6281234567890",
          })
          .returning();
        merchantId = newM.id;
      }
    }

    const [newClient] = await db
      .insert(clients)
      .values({
        merchantId,
        name: body.name,
        phoneWa: body.phoneWa,
        email: body.email || null,
      })
      .returning();

    return NextResponse.json({ success: true, client: newClient }, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Clients API] Failed to create client:", errorMsg);
    return NextResponse.json(
      { error: "Internal server error creating client" },
      { status: 500 }
    );
  }
}
