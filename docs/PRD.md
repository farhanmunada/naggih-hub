# Product Requirements Document (PRD): NagihHub

## 1. Visi & Tujuan Produk
NagihHub adalah platform penagihan otomatis mikro-SaaS untuk UMKM dan freelancer Indonesia. Menghilangkan pembuatan invoice manual, mengganti pemeriksaan bukti transfer manual dengan payment gateway, dan mengotomasi follow-up pengingat jatuh tempo via WhatsApp.

## 2. Sasaran Pengguna
- Freelancer (desainer, pengembang web, konsultan, kreator konten).
- UMKM dengan transaksi B2B atau B2C bertiket menengah (Rp50.000 - Rp50.000.000).

## 3. Fitur Utama

### A. Manajemen Merchant & Klien
- Input data profil merchant (nama bisnis, email, nomor WhatsApp).
- Manajemen kontak klien (nama, WhatsApp, email).

### B. Pembuatan Tagihan (Invoice Generation)
- Pembuatan invoice multi-item (deskripsi, jumlah, harga satuan, kalkulasi subtotal otomatis).
- Nomor invoice unik berformat (`INV/YYYYMM/XXXX`).
- Pembuatan tautan publik aman (`/pay/[public_hash]`) berbasis hash acak SHA-256.

### C. Halaman Pembayaran Publik (Client Payment Page)
- Desain *Swiss Minimalism* modern serba putih.
- Informasi lengkap invoice, rincian biaya, tenggat waktu (due date), status badge (`PENDING`, `PAID`, `EXPIRED`).
- Tombol aksi bayar terintegrasi Midtrans Snap (QRIS, VA Bank Transfer: BCA, Mandiri, BNI, BRI).

### D. Rekonsiliasi Pembayaran Idempoten (Webhook)
- Endpoint: `POST /api/v1/webhooks/midtrans`.
- Verifikasi tanda tangan SHA-512 `order_id + status_code + gross_amount + server_key`.
- Idempotency guard: menggunakan unique constraint pada `payment_logs.gateway_reference`.
- Pembaruan status invoice menjadi `PAID` dan pengisian `paid_at`.
- Pengiriman notifikasi WhatsApp instan ke klien saat pembayaran terkonfirmasi lunas.

### E. Mesin Pengingat Jatuh Tempo (Dunning Engine)
- Endpoint cron: `GET /api/v1/cron/dunning` dengan proteksi token rahasia.
- Query invoice `PENDING` yang mendekati jatuh tempo pada H-3, H-1, dan Day 0.
- Pengiriman pesan WhatsApp sopan berisi tautan pelunasan dengan throttle jeda antar pesan.

## 4. Standar Desain & Antarmuka (No AI Slop)
- **Gaya:** Swiss Minimalism / Clean Functional White.
- **Warna:**
  - Background: `#F8FAFC`
  - Surface/Card: `#FFFFFF`
  - Border: 1px solid `#E2E8F0`
  - Teks Utama: `#0F172A`
  - Teks Muted: `#64748B`
  - Aksen Sukses (`PAID`): `#059669`
  - Aksen Peringatan: `#D97706`
  - Aksen Destruktif: `#DC2626`
- **Tipografi:** Plus Jakarta Sans / Inter.
- **Ikon:** Lucide Icons (SVG murni, 1.5px stroke, dilarang emoji untuk kontrol navigasi).

## 5. Kriteria Penerimaan (Acceptance Criteria)
- [ ] Invoice dapat dibuat dan diakses via URL publik `/pay/[public_hash]`.
- [ ] Tombol bayar membuka modal Midtrans Snap sandbox.
- [ ] Webhook Midtrans memperbarui status menjadi `PAID` secara idempoten (webhook berulang tidak menduplikasi audit log atau notifikasi).
- [ ] Cron endpoint mengidentifikasi invoice yang memenuhi kriteria pengingat dan mengirimkan pesan WhatsApp terformat.
- [ ] Tampilan antarmuka memenuhi rasio kontras teks minimal 4.5:1.
