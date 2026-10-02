# Arsitektur Sistem: NagihHub

## 1. Diagram Arsitektur & Alur Kerja

```
[ Klien / Browser ]  <-------- (HTTPS / Public Link) -------->  [ Next.js App Router ]
                                                                        |
                                                     +------------------+------------------+
                                                     |                                     |
                                                     v                                     v
                                            [ Route Handlers ]                    [ Server Components ]
                                            - POST /webhooks/midtrans             - /pay/[hash]
                                            - GET  /cron/dunning                  - /dashboard
                                            - POST /invoices/create                        |
                                                     |                                     |
                                                     +------------------+------------------+
                                                                        |
                                                                        v
                                                             [ Drizzle ORM / SQL ]
                                                                        |
                                                                        v
                                                          [ Neon Serverless PostgreSQL ]
                                                          - merchants, clients
                                                          - invoices, invoice_items
                                                          - payment_logs
                                                                        |
                                                     +------------------+------------------+
                                                     |                                     |
                                                     v                                     v
                                            [ Midtrans Snap API ]                  [ WhatsApp Gateway ]
                                            (Token & Signature)                    (Fonnte / WAHA HTTP)
```

## 2. Skema Basis Data (Neon DB / Drizzle ORM)

```typescript
// src/lib/db/schema.ts
import { pgTable, uuid, varchar, decimal, date, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';

export const merchants = pgTable('merchants', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessName: varchar('business_name', { length: 150 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  phoneWa: varchar('phone_wa', { length: 25 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').references(() => merchants.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  phoneWa: varchar('phone_wa', { length: 25 }).notNull(),
  email: varchar('email', { length: 150 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').references(() => merchants.id, { onDelete: 'cascade' }).notNull(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'restrict' }).notNull(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  publicHash: varchar('public_hash', { length: 64 }).notNull().unique(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  dueDate: date('due_date').notNull(),
  status: varchar('status', { length: 20 }).default('PENDING').notNull(), // DRAFT, PENDING, PAID, EXPIRED
  paymentToken: varchar('payment_token', { length: 255 }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
});

export const paymentLogs = pgTable('payment_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  gatewayReference: varchar('gateway_reference', { length: 100 }).notNull().unique(),
  paymentType: varchar('payment_type', { length: 50 }).notNull(),
  rawPayload: jsonb('raw_payload').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
});
```

## 3. Struktur Direktori Proyek

```
naggih-hub/
├── docs/
│   ├── RESEARCH.md
│   ├── PRD.md
│   └── ARCHITECTURE.md
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── webhooks/
│   │   │   │   │   └── midtrans/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── cron/
│   │   │   │   │   └── dunning/
│   │   │   │   │       └── route.ts
│   │   │   │   └── invoices/
│   │   │   │       └── route.ts
│   │   ├── pay/
│   │   │   └── [hash]/
│   │   │       ├── page.tsx
│   │   │       └── snap-pay-button.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   └── invoice/
│   └── lib/
│       ├── db/
│       │   ├── index.ts
│       │   └── schema.ts
│       ├── midtrans.ts
│       ├── whatsapp.ts
│       └── utils.ts
├── drizzle.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

## 4. Rencana Pemecahan Tugas (Task Breakdown)
1. **Inisialisasi Project & Konfigurasi:**
   - Inisialisasi Next.js (App Router, Tailwind CSS, TypeScript).
   - Setup Drizzle ORM + Neon Database client.
2. **Domain Data Layer & Migrasi:**
   - Implementasi skema tabel Drizzle.
   - Script migrasi dan seeder dummy merchant, client, invoice.
3. **Midtrans Adapter & Webhook:**
   - Service helper Midtrans Snap token generation.
   - Handler webhook idempoten dengan verifikasi signature SHA-512 dan DB transaction.
4. **WhatsApp Notification Adapter & Dunning Cron:**
   - Client HTTP pengirim pesan WhatsApp (Fonnte/WAHA).
   - Route handler `/api/v1/cron/dunning` dengan rate limiting.
5. **Antarmuka Klien (Payment Page):**
   - Halaman publik `/pay/[hash]` dengan style Swiss Minimalism serba putih.
   - Komponen tombol bayar memicu modal Midtrans Snap.
6. **Verifikasi:**
   - Test unit/integrasi untuk signature verification, idempotensi webhook, kalkulasi total invoice.
   - Build check & typecheck.
