import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "NagihHub - Automated Billing & Collection",
  description:
    "Platform penagihan otomatis dan pengingat WhatsApp terintegrasi Midtrans untuk UMKM dan Freelancer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const snapUrl =
    process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ||
    "https://app.sandbox.midtrans.com/snap/snap.js";
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className="min-h-screen bg-background antialiased flex flex-col justify-between"
        suppressHydrationWarning
      >
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} NagihHub. Penagihan otomatis aman &
            terpercaya.
          </p>
        </footer>
        <Script
          src={snapUrl}
          data-client-key={clientKey}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
