# ☕ Omah — Sistem Manajemen Keluarga Privat

> **Aplikasi web privat mobile-first untuk dua pengguna (suami dan istri) guna mengelola keuangan rumah tangga, daftar belanja, pembagian tugas harian, brankas dokumen penting, serta pengingat jatuh tempo otomatis.**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![Prisma 7](https://img.shields.io/badge/Prisma-7.10-2D3748?logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Realtime-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: Private](https://img.shields.io/badge/License-Private-1E3932)](#)

---

## 📌 Latar Belakang & Filosofi Desain

**Omah** (dari bahasa Jawa yang berarti *Rumah*) dibangun untuk menyelesaikan masalah pencatatan keuangan dan tanggung jawab rumah tangga yang kerap tercecer di chat pribadi, catatan terpisah, atau sekadar ingatan kepala masing-masing yang memicu kesalahpahaman atau tagihan terlewat.

### Prinsip Utama Produk:
1. **Input Kurang dari 10 Detik:** Pencatatan transaksi harian dioptimalkan untuk perangkat ponsel dengan modal input cepat (*Quick Transaction Modal*) dan nilai default cerdas.
2. **Fitur Esensial & Fokus:** Berisi fitur-fitur yang benar-benar dipakai sehari-hari, bukan sekadar pelengkap yang akhirnya ditinggalkan.
3. **Privat & Khusus 2 Anggota:** Dirancang secara ketat untuk batas maksimal 2 anggota keluarga (`ADMIN` dan `MEMBER`) dengan hak visibilitas penuh tanpa mode transaksi rahasia.
4. **Keamanan Bertingkat:** Tanpa penyimpanan nomor rekening penuh/NIK sensitif di fase awal, hash token satu arah (SHA-256) untuk undangan, dan pembatasan isolasi tenant berbasis `household_id`.

---

## 🎨 Estetika Desain: *Starbucks Heritage Edition*

Antarmuka Omah mengadopsi palet warna hangat, bersahaja, dan premium yang terinspirasi dari **Starbucks Heritage**:

- **House Green (`#1E3932`):** Warna hijau hutan gelap yang elegan untuk header, judul serif, dan elemen dominan.
- **Starbucks Green (`#006241`):** Aksen hijau ikonik untuk tombol utama, indikator aktif, dan status sukses.
- **Warm Cream / Canvas (`#F2F0EB`):** Latar belakang kanvas yang menenangkan mata dan ramah layar AMOLED.
- **Warm Gold & Bronze (`#CBA258` / `#C87A54`):** Warna kontras untuk peringatan anggaran, tenggat jatuh tempo, dan grafik pengeluaran.
- **Dual Elevation & Smooth Borders:** Sudut kartu beradius `12px` hingga `16px` dengan bayangan bertingkat lembut (*Starbucks Card Elevation*).

---

## 🚀 Fitur & Modul Utama

### 1. 💰 Manajemen Keuangan & Anggaran
- **Transaksi Cepat (< 10 Detik):** Pencatatan instan *Pemasukan*, *Pengeluaran*, dan *Transfer Dompet* dengan validasi otomatis.
- **Dompet Saldo Dinamis:** Saldo kas, rekening bank, dan e-wallet dihitung secara matematis dari `opening_balance + total transaksi aktif` untuk mencegah inkonsistensi saldo.
- **Siklus Anggaran Periode Kustom:** Anggaran bulanan berbasis tanggal gajian rumah tangga (misal: tiap tanggal 25) dengan pelacakan persentase terpakai serta peringatan otomatis ambang batas 80% dan 100%.
- **Tagihan Berulang & Konfirmasi Bayar:** Jadwal tagihan rutin (listrik, internet, air, dll.) dengan status *Lunas / Belum Bayar* tiap siklus dan opsi pencatatan transaksi otomatis saat ditandai lunas.
- **Target Tabungan (*Savings Goals*):** Pelacakan tabungan bersama untuk liburan, dana darurat, atau renovasi rumah lengkap dengan progress bar persentase.

### 2. 🛒 Belanja Bersama & Tugas Rumah
- **Daftar Belanja (*Real-time Checklist*):** Item belanja pasar atau supermarket yang tersinkronisasi instan antar perangkat suami dan istri.
- **Pembagian Tugas Rumah (*Household Tasks*):** Pengaturan PIC penanggung jawab tugas, tanggal tenggat, frekuensi pengulangan (harian/mingguan), dan filter *Tugas Saya vs Tugas Pasangan*.

### 3. ⏰ Pengingat Jatuh Tempo & Feed Kalender
- **Pengingat Dokumen Berkala:** Notifikasi sebelum jatuh tempo untuk Pajak Kendaraan, Perpanjangan STNK, SIM, Polis Asuransi Jiwa/Kesehatan, dan Masa Berlaku Garansi.
- **Sinkronisasi iCal (Google Calendar / Apple Calendar):** Setiap rumah tangga memiliki URL rahasia feed iCal untuk berlangganan pengingat langsung di aplikasi kalender ponsel.

### 4. 📂 Brankas Dokumen & Inventaris Aset (Fase 2)
- **Brankas Dokumen Keluarga (`/vault`):** Penyimpanan aman salinan identitas (KTP, KK, Akta Nikah), sertifikat rumah/tanah, berkas kendaraan, dan polis asuransi.
- **Aset & Riwayat Servis (`/assets`):** Katalog barang berharga, masa garansi elektronik, dan riwayat ganti oli / perawatan berkala kendaraan.
- **Catatan Angpao & Kondangan (`/kondangan`):** Buku tamu digital timbal balik amplop/hadiah hajatan kerabat untuk menjaga hubungan sosial kekeluargaan.
- **Meal Planner Mingguan (`/meals`):** Rencana menu sarapan, makan siang, dan makan malam keluarga yang dapat langsung di-ekspor ke daftar belanja dapur dalam satu klik.
- **Laporan & Tren Tahunan (`/analytics`):** Grafik garis interaktif Catmull-Rom Bezier SVG untuk memantau tren arus kas bulanan secara responsif.

### 5. 🤖 Multi-Channel Notifications (Telegram & WhatsApp)
- **Bot Telegram Terenkripsi:** Menerima pengingat harian jatuh tempo tagihan (H-3 dan H-0) serta perintah cepat interaktif (`/saldo`, `/tagihan`, `/tugas`).
- **Kanal WhatsApp via WAHA Gateway:** Notifikasi langsung ke nomor WhatsApp suami dan istri via REST gateway mandiri, lengkap dengan webhook dua arah.
- **Vercel Cron Harian:** Penjadwalan otomatis setiap pukul **08:00 WIB** (`01:00 UTC`) yang idempoten dan menjalankan *keepalive ping* database Supabase free tier.

---

## 🛠️ Tech Stack & Arsitektur

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server Components, Server Actions, Dynamic Routes |
| **Bahasa** | TypeScript | *Strict type safety* di seluruh lapisan aplikasi |
| **Database & ORM** | PostgreSQL (Supabase) + Prisma 7 | Menggunakan driver adapter `@prisma/adapter-pg` |
| **Otentikasi** | Supabase Auth + Session Cookie | Dukungan Magic Link, Password, dan Mode Akun Testing |
| **Realtime** | Supabase Realtime Channels | Sinkronisasi instan daftar belanja & tugas rumah |
| **Styling** | Tailwind CSS v4 + Vanilla CSS | Desain kustom bertema Starbucks Heritage |
| **Ikon** | Lucide React | Ikon modern, ringan, dan konsisten |
| **Integrasi Notifikasi** | Telegram Bot API & WAHA (WhatsApp) | Abstraksi *multi-channel notification dispatcher* |
| **Cron Job** | Vercel Cron (`vercel.json`) | Pemrosesan pengingat harian & Supabase keepalive |

---

## 📁 Struktur Direktori Project

```text
project-omah/
├── prisma/
│   ├── schema.prisma            # Skema relasional PostgreSQL (16 tabel bisnis)
│   ├── migrations/              # Riwayat migrasi Prisma Migrate
│   └── constraints.sql          # CHECK constraints & aturan integritas data
├── public/
│   ├── icons/                   # Ikon PWA maskable (192px, 512px, SVG)
│   └── site.webmanifest
├── src/
│   ├── actions/                 # Next.js Server Actions (Auth, Bills, Tasks, dsb.)
│   ├── app/                     # Next.js App Router Pages & Route Handlers
│   │   ├── (auth)/login/        # Halaman autentikasi & Masuk Akun Testing
│   │   ├── analytics/           # Laporan tren tahunan & Line Chart
│   │   ├── api/                 # API Cron, iCal Feed, Webhook WA & Telegram, Export CSV
│   │   ├── assets/              # Manajemen aset & riwayat servis
│   │   ├── invite/[token]/      # Halaman penerimaan undangan pasangan
│   │   ├── kondangan/           # Catatan angpao & amplop hajatan
│   │   ├── meals/               # Meal planner mingguan
│   │   ├── reminders/           # Pengingat tanggal jatuh tempo dokumen
│   │   ├── settings/            # Pengaturan keluarga, notifikasi, & anggota
│   │   ├── shopping/            # Daftar belanja bersama
│   │   ├── tasks/               # Pembagian tugas rumah tangga
│   │   ├── transactions/        # Riwayat & filter transaksi keuangan
│   │   ├── vault/               # Brankas dokumen keluarga
│   │   ├── layout.tsx           # Root layout & penyedia font Google
│   │   ├── manifest.ts          # Konfigurasi PWA Web App Manifest
│   │   └── page.tsx             # Dashboard ringkasan (Tab Keuangan & Aktivitas)
│   ├── components/              # Komponen UI modular
│   │   ├── analytics/           # SVG Catmull-Rom Cashflow Line Chart
│   │   ├── dashboard/           # Widget saldo, anggaran, tagihan, tab aktivitas
│   │   ├── layout/              # Header, Bottom Navigation, Desktop Sidebar, FAB
│   │   └── settings/            # Kartu saluran notifikasi WA/Telegram, profile card
│   ├── lib/
│   │   ├── data/                # Data-Access Layer terpusat (tenant-scoped queries)
│   │   ├── notifications/       # Driver Telegram Bot & WAHA WhatsApp Gateway
│   │   ├── supabase/            # Client & server helpers Supabase Auth
│   │   ├── prisma.ts            # Prisma Client singleton dengan adapter pooler
│   │   └── utils.ts             # Formatter Rupiah, manipulasi tanggal WIB, styling
│   └── proxy.ts                 # Next.js 16 Route Protection Proxy (pengganti middleware)
├── docker-compose.waha.yml       # Docker Compose untuk menjalankan WAHA lokal
├── vercel.json                  # Penjadwal Vercel Cron harian
└── .env.example                 # Template variabel lingkungan
```

---

## ⚙️ Panduan Menjalankan Project (Lokal)

### 1. Prasyarat
- **Node.js:** Versi `20.x` atau lebih baru
- **Package Manager:** `pnpm` versi `9.x` atau lebih baru
- **Database:** PostgreSQL (disarankan proyek gratis di [Supabase](https://supabase.com))
- **Docker:** (Opsional, hanya jika ingin menjalankan gateway WhatsApp WAHA lokal)

### 2. Kloning & Instalasi Dependensi
```bash
git clone https://github.com/username/project-omah.git
cd project-omah
pnpm install
```

### 3. Konfigurasi Variabel Lingkungan (`.env`)
Salin file template `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi database dan API key Anda:
```env
# Koneksi Database Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Supabase Auth & Storage
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Vercel Cron Token
CRON_SECRET="your-cron-secret-token"

# Notifikasi Telegram Bot (Opsional)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_BOT_USERNAME="OmahFamilyBot"
TELEGRAM_WEBHOOK_SECRET="your-webhook-secret"

# Notifikasi WhatsApp WAHA (Opsional)
WAHA_BASE_URL="http://localhost:3008"
WAHA_API_KEY="your-waha-api-key"
```

### 4. Migrasi Database Prisma
Jalankan migrasi skema ke database Supabase Anda:
```bash
pnpm prisma migrate dev
```

### 5. Jalankan Server Pengembangan
```bash
pnpm dev
```
Buka browser di **`http://localhost:3000`**.

> **💡 Tips Pengujian Cepat:**  
> Jika belum mengonfigurasi email Supabase, Anda dapat langsung mengklik tombol **"⚡ Masuk Cepat Akun Testing (Reynaldi / Admin)"** di halaman `/login` untuk langsung masuk ke dashboard dengan sesi simulasi penuh.

---

## 🔒 Keamanan & Hak Akses

1. **Aturan Filter Tenant (Household Scoping):** Setiap query ke database wajib difilter dengan `householdId` yang tervalidasi dari sesi login aktif. Klien tidak pernah diizinkan mengirim `householdId` secara langsung.
2. **Hash Token Undangan:** Tautan undangan anggota keluarga (`/invite/[token]`) disimpan dalam bentuk digest hash **SHA-256**, memiliki masa berlaku 7 hari, dan dibatasi maksimal 2 anggota per keluarga.
3. **Penyimpanan Dokumen:** Berkas di Brankas Dokumen disimpan dalam bucket privat Supabase Storage dengan penamaan berbasis prefix `household_id/uuid`.

---

## 📜 Lisensi & Penggunaan

Proyek ini dibangun secara privat untuk kebutuhan internal pengelolaan rumah tangga dan keluarga. Seluruh hak cipta dan kode sumber dilindungi secara privat.
