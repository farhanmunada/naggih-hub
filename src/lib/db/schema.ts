import { pgTable, uuid, varchar, decimal, date, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const merchants = pgTable("merchants", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessName: varchar("business_name", { length: 150 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  phoneWa: varchar("phone_wa", { length: 25 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  merchantId: uuid("merchant_id")
    .references(() => merchants.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  phoneWa: varchar("phone_wa", { length: 25 }).notNull(),
  email: varchar("email", { length: 150 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  merchantId: uuid("merchant_id")
    .references(() => merchants.id, { onDelete: "cascade" })
    .notNull(),
  clientId: uuid("client_id")
    .references(() => clients.id, { onDelete: "restrict" })
    .notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  publicHash: varchar("public_hash", { length: 64 }).notNull().unique(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(), // DRAFT, PENDING, PAID, EXPIRED
  paymentToken: varchar("payment_token", { length: 255 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id, { onDelete: "cascade" })
    .notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
});

export const paymentLogs = pgTable("payment_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id, { onDelete: "cascade" })
    .notNull(),
  gatewayReference: varchar("gateway_reference", { length: 100 }).notNull().unique(),
  paymentType: varchar("payment_type", { length: 50 }).notNull(),
  rawPayload: jsonb("raw_payload").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const merchantsRelations = relations(merchants, ({ many }) => ({
  clients: many(clients),
  invoices: many(invoices),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [clients.merchantId],
    references: [merchants.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [invoices.merchantId],
    references: [merchants.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  items: many(invoiceItems),
  paymentLogs: many(paymentLogs),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentLogsRelations = relations(paymentLogs, ({ one }) => ({
  invoice: one(invoices, {
    fields: [paymentLogs.invoiceId],
    references: [invoices.id],
  }),
}));

export type Merchant = typeof merchants.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type PaymentLog = typeof paymentLogs.$inferSelect;
