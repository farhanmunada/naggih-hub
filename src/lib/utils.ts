import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number | string): string {
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numeric)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function formatDateIndo(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function generatePublicHash(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateInvoiceNumber(sequence: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = String(sequence).padStart(4, "0");
  return `INV/${year}${month}/${seq}`;
}
