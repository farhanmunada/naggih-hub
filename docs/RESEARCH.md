# Riset Teknis: NagihHub

## 1. Analisis Kebutuhan & Problem Space
NagihHub menyelesaikan friksi penagihan pembayaran bagi UMKM & freelancer Indonesia:
- **Pain point:** Invoice PDF WhatsApp manual, verifikasi mutasi/bukti transfer manual rawan bukti palsu, tindak lanjut tagihan (dunning) sering terlewat.
- **Solusi inti:**
  1. Halaman pembayaran publik dengan enkripsi hash unik (`/pay/[public_hash]`).
  2. Integrasi Midtrans Snap sandbox (QRIS & Virtual Account bank lokal).
  3. Webhook rekonsiliasi pembayaran instan dan idempoten.
  4. Pengingat otomatis via WhatsApp (H-3, H-1, Day 0) via Fonnte / WAHA.

## 2. Tech Stack & Komparasi Ekosistem
- **Runtime & Framework:** Next.js (App Router, React 19).
  - Alasan: 1 bahasa (TypeScript/JavaScript), API Route Handler bawaan untuk webhook Midtrans & cron worker, Server Component untuk render invoice instan tanpa waterfall client-side.
- **Database:** Neon DB (Serverless PostgreSQL).
  - Driver: `@neondatabase/serverless` + Drizzle ORM.
  - Alasan: Koneksi berbasis HTTP/WebSocket tanpa overhead koneksi pooled berat, typing aman, migrasi SQL deklaratif.
- **Payment Gateway:** Midtrans Snap (Sandbox).
  - Mekanisme: Request Snap Token di server (`POST https://app.sandbox.midtrans.com/snap/v1/transactions`), render checkout modal via `window.snap.pay`.
  - Keamanan: Validasi SHA-512 `order_id + status_code + gross_amount + server_key`.
- **WhatsApp Gateway:** Fonnte API / WAHA HTTP endpoint.
  - Alasan: REST API sederhana, payload JSON langsung tanpa library berat.
- **Desain & UI:**
  - Swiss Minimalism modern serba putih (`#FFFFFF`, `#F8FAFC`, `#0F172A`).
  - Lucide React (vektor SVG murni).
  - Anti-AI slop: tanpa gradasi ungu/pink, tanpa radius ekstrem, tanpa shadow blur tebal.

## 3. Mitigasi Risiko & Keamanan
1. **Idempotensi Webhook:**
   - Webhook ganda dari payment gateway ditangani via constraint unik pada `payment_logs(gateway_reference)`.
   - Transaksi database atomik: jika invoice sudah `PAID`, sistem mengabaikan proses ulang tanpa gagal (return 200 OK).
2. **Rate Limiting WhatsApp:**
   - Eksekusi pengiriman pengingat berkala diberi jeda waktu (throttle 2-3 detik per pesan) untuk mencegah pemblokiran nomor oleh WhatsApp.
3. **Penyimpanan Kunci Rahasia:**
   - Kunci server Midtrans dan API token WhatsApp berada di environment variable (`.env.local`), tidak terekspos ke klien.
