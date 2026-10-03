# PRD: Sistem Manajemen Keluarga (Internal)

**Versi:** 0.6 (draft) · **Tanggal:** 1 Oktober 2026 · **Pemilik:** Household Admin **Status:** Draft untuk direview. Estimasi waktu bersifat kasar dan perlu disesuaikan dengan waktu luang nyata.

---

## 1. Ringkasan

Aplikasi web privat untuk dua pengguna (suami dan istri) guna mengelola keuangan rumah tangga, belanja, tugas rumah, serta pengingat jatuh tempo (tagihan, pajak kendaraan, asuransi). Dipakai **setelah menikah**. Persiapan pernikahan berada di luar lingkup.

**Masalah yang diselesaikan:** pencatatan keuangan dan tanggung jawab rumah tangga yang tercecer di chat, kepala masing-masing, dan catatan terpisah, sehingga muncul salah paham dan tagihan terlewat.

**Prinsip produk:**

1. Input data harus selesai dalam waktu kurang dari 10 detik dari ponsel.
2. Fitur sedikit tetapi benar-benar dipakai, bukan banyak tetapi ditinggalkan.
3. Data sensitif seminimal mungkin.

## 2. Tujuan dan non-tujuan

**Tujuan (fase 1)**

- Kedua pasangan bisa mencatat pengeluaran dan pemasukan bersama dengan cepat.
- Anggaran bulanan per kategori terlihat jelas (terpakai vs sisa).
- Tagihan berulang dan dokumen bertanggal (STNK, pajak, asuransi) memberi pengingat sebelum jatuh tempo.
- Daftar belanja dan tugas rumah dapat dikerjakan bersama secara real-time.

**Non-tujuan**

- Bukan aplikasi multi-keluarga atau SaaS publik. Dirancang untuk satu household, tetapi skema tetap memakai `household_id` agar tidak perlu dirombak.
- Tidak membangun kalender sendiri. Tanggal jatuh tempo diekspor sebagai feed iCal ke Google Calendar.
- Tidak ada integrasi rekening bank atau e-wallet otomatis.
- Tidak ada mode transaksi privat: seluruh data bersifat bersama.
- WhatsApp belum masuk fase 1 (Telegram bot lebih dulu).
- Tidak menyimpan NIK, nomor rekening, atau data kesehatan pada fase 1.
- Tidak ada modul persiapan pernikahan.

## 3. Pengguna

| Peran | Deskripsi |
| --- | --- |
| Admin household | Pembuat household (Kepala Keluarga). Mengundang pasangan, mengelola kategori dan pengaturan. |
| Anggota | Pasangan. Hak CRUD yang sama atas data bersama. |

Hanya dua pengguna, dua-duanya memakai ponsel sebagai perangkat utama.

## 4. Asumsi dan risiko

| # | Asumsi / risiko | Dampak jika salah | Mitigasi |
| --- | --- | --- | --- |
| R1 | Pasangan mau mencatat secara konsisten (keputusan: pasangan tidak dilibatkan sebelum coding) | Sistem ditinggalkan; data tidak lengkap | Risiko naik karena kebutuhan pasangan tidak dikumpulkan di awal; mitigasi: UI mobile-first, input maksimal 3 ketukan, dan pantau sinyal berhenti (bagian 11) sejak minggu pertama pemakaian |
| R2 | Vercel Cron paket Hobby hanya sekali sehari dengan presisi jadwal sekitar 59 menit | Pengingat tidak tepat jam; job yang gagal baru berjalan lagi 24 jam kemudian | Pengingat berbasis tanggal (H-3, H-0), bukan jam presisi; job idempoten dan dapat dipanggil manual; peringatan anggaran dikirim saat transaksi disimpan |
| R3 | Prisma + Supabase RLS dianggap otomatis aman | Kebocoran data antar-household jika otorisasi hanya mengandalkan RLS | Lihat bagian 8: Prisma terhubung sebagai role database sehingga RLS tidak berlaku otomatis; otorisasi wajib ditegakkan di lapisan aplikasi |
| R4 | Anda mau merawat sistem bertahun-tahun | Sistem usang, keamanan tidak diperbarui | Batasi scope, dependensi minimal, backup otomatis, ekspor CSV |
| R5 | Semua data terlihat kedua pihak (tanpa mode privat) | Salah satu pihak merasa tidak punya ruang, lalu mencatat sebagian di luar sistem | Sepakati aturan pencatatan; pengeluaran pribadi dapat dicatat sebagai satu kategori agregat (mis. "Uang pribadi") tanpa detail |
| R6 | Supabase free: project dijeda otomatis jika aktivitas rendah selama seminggu, dan tanpa backup otomatis | Aplikasi dan pengingat mati sampai dipulihkan; data hilang total jika terjadi kerusakan tanpa backup mandiri | Job harian melakukan query ringan (keepalive); backup mandiri terenkripsi + uji restore menjadi syarat sebelum data nyata dimasukkan (bagian 8.1 dan 8.2) |
| R7 | WhatsApp via WAHA (tidak resmi) | Nomor dapat dibatasi atau diblokir; sesi dapat terputus; perlu server yang menyala terus (biaya dan perawatan di luar free tier) | Telegram tetap kanal utama; WhatsApp hanya tambahan di Fase 2 dengan nomor khusus dan volume kecil; kegagalan WhatsApp tidak boleh menggagalkan pengingat Telegram (bagian 8.3) |
| R8 | Klien mengirim id wallet/kategori milik household lain | Data tertulis ke atau bocor dari household lain | Verifikasi kepemilikan di data-access layer sebelum setiap insert/update (Prisma tidak memastikannya); pertimbangkan composite FK `(household_id, id)` bila ingin ditegakkan di database |

## 5. Cakupan fitur

### Fase 1 (MVP)

#### 5.1 Keuangan bersama

- **Transaksi:** jumlah, tipe (pengeluaran/pemasukan/transfer), kategori, dompet, tanggal, catatan, pencatat.
- **Dompet/akun:** kas, rekening, e-wallet (hanya nama dan saldo awal; saldo saat ini dihitung dari transaksi; tanpa nomor rekening).
- **Kategori:** default (makan, transport, tagihan, belanja rumah, dll.), dapat diubah.
- **Anggaran periode custom:** periode dimulai pada tanggal yang ditentukan household (mis. tanggal gajian), batas per kategori yang berlaku sampai diubah (tanpa menyalin tiap periode), indikator terpakai/sisa, peringatan saat melewati 80% dan 100% (via Telegram).
- **Tagihan berulang:** nama, nominal, periode (bulanan/tahunan), tanggal jatuh tempo, status sudah dibayar untuk jatuh tempo terdekat; pengingat H-3 dan H-0 via Telegram (bisa dikonfigurasi).
- **Target tabungan:** nama target, nominal target, terkumpul, tenggat opsional.
- **Ringkasan periode:** total pemasukan, pengeluaran, sisa, dan 5 kategori terbesar.

**Kriteria penerimaan:**

- Menambah transaksi selesai dalam waktu kurang dari 10 detik (jumlah, kategori, simpan) dengan nilai default cerdas (tanggal hari ini, dompet terakhir dipakai).
- Perubahan dari satu perangkat tampil di perangkat pasangan dalam waktu kurang dari 5 detik tanpa muat ulang manual.
- Semua nominal disimpan sebagai bilangan bulat rupiah (tanpa desimal).
- Tanggal transaksi disimpan sebagai tanggal WIB tanpa jam, sehingga batas periode anggaran tidak bergeser karena zona waktu.

#### 5.2 Daftar belanja dan tugas rumah

- Beberapa daftar belanja (mis. "Pasar", "Bulanan"); item dapat dicentang bersama secara real-time.
- Tugas rumah: judul, penanggung jawab, tenggat, ulangan (harian/mingguan), status selesai.
- Tampilan "tugas saya" dan "tugas pasangan".

**Kriteria penerimaan:** centang di satu perangkat muncul di perangkat lain dalam waktu kurang dari 5 detik.

#### 5.3 Pengingat jatuh tempo

- Entitas pengingat bertanggal: pajak kendaraan, perpanjangan STNK, asuransi, paspor, garansi, dll.
- Kolom: judul, tanggal jatuh tempo, ulangan, jumlah hari pengingat sebelum jatuh tempo, catatan.
- Feed iCal (URL rahasia per household) untuk berlangganan di Google Calendar.
- Belum ada unggah dokumen pada fase 1 (lihat fase 2).

#### 5.4 Fondasi lintas fitur

- Autentikasi (email + magic link atau password), undangan pasangan via tautan.
- Integrasi Telegram bot: tautkan akun lewat kode sekali pakai; bot mengirim pengingat tagihan, dokumen bertanggal, dan peringatan anggaran.
- Audit log ringan pada modul keuangan.
- Ekspor CSV (transaksi, anggaran, tagihan).
- Web app mobile-first yang dapat ditambahkan ke layar utama lewat web app manifest dan ikon. **Tanpa service worker dan tanpa cache offline**: pembaruan harus langsung terlihat setelah deploy, dan aplikasi memerlukan koneksi. Sediakan tombol "Muat ulang" di UI karena mode layar utama di iOS tidak selalu punya gestur segarkan.

### Fase 2 (hanya jika fase 1 terpakai konsisten ≥ 2 bulan)

- Brankas dokumen (Supabase Storage, enkripsi, akses berbasis household).
- Aset, garansi, riwayat servis kendaraan.
- Catatan angpao/kondangan.
- Menu mingguan terhubung ke daftar belanja.
- Laporan tahunan dan tren.
- Kanal WhatsApp untuk pengingat lewat WAHA (lihat bagian 8.3), diimplementasikan sebagai `NotificationChannel` tambahan.

## 6. Persyaratan fungsional rinci

### 6.1 Autentikasi dan household

- Pengguna pertama membuat household; pasangan bergabung lewat tautan undangan sekali pakai dengan masa berlaku.
- Token undangan disimpan sebagai hash di tabel `invitations` (bukan token mentah), memiliki `expires_at`, dan ditandai terpakai (`used_at`). Batas maksimal dua anggota per household ditegakkan di aplikasi.
- Satu pengguna hanya tergabung di satu household pada fase 1.

### 6.2 Transaksi

- Edit dan hapus memakai soft delete (`deleted_at`) dan tercatat di audit log.
- Transfer antar-dompet dicatat sebagai satu transaksi bertipe `TRANSFER` dan tidak dihitung sebagai pengeluaran.
- Saldo dompet saat ini = `opening_balance` + transaksi aktif (pemasukan, pengeluaran, dan transfer masuk/keluar). Saldo tidak disimpan agar tidak melenceng.
- Setiap query transaksi wajib memfilter `deleted_at IS NULL`. Aturan bentuk data (jumlah > 0, ketentuan TRANSFER) ditegakkan CHECK di database (`constraints.sql`).

### 6.3 Anggaran

- Periode dimulai pada `period_start_day` (1-28, satu nilai per household) dan berakhir sehari sebelum tanggal yang sama bulan berikutnya. Batas 1-28 menghindari masalah bulan pendek. Anggaran dan ringkasan mengacu pada periode ini, bukan bulan kalender.
- Mengubah `period_start_day` hanya berlaku untuk periode berikutnya; periode lama tidak dihitung ulang.
- Batas anggaran per kategori disimpan dengan `effective_from`: batas untuk suatu periode adalah baris dengan `effective_from` terbesar yang kurang dari atau sama dengan tanggal awal periode. `limit_amount` 0 berarti tanpa batas. Dengan begitu batas tidak perlu disalin setiap periode.

### 6.4 Pengingat

- Penjadwalan berjalan di server memakai Vercel Cron, bukan di klien. Pada paket Hobby (free), cron hanya boleh berjalan sekali sehari dan waktu eksekusi bisa meleset hingga sekitar 59 menit dari jadwal (sesuai dokumentasi Vercel per Juli 2026; cek ulang saat implementasi). Ekspresi cron yang lebih sering akan gagal saat deploy.
- Konsekuensinya: satu job harian yang memproses semua pengingat dan tagihan. Vercel Cron memakai UTC: jadwal 01:00 UTC berarti eksekusi antara 08:00 dan 08:59 WIB. Pengingat dirancang berbasis tanggal (H-3, H-0), bukan jam presisi.
- Endpoint cron harus idempoten (memakai tabel `notification_logs`: satu baris unik per penerima, kanal, entitas, tanggal jatuh tempo, dan slot), dilindungi secret (`CRON_SECRET`), dan dapat dipanggil manual untuk pengujian.
- Setiap pengiriman dicatat di `notification_logs` dengan status SENT atau FAILED. Slot = selisih hari sebelum jatuh tempo (H-3 → 3, H-0 → 0) untuk tagihan dan pengingat, atau ambang persen (80/100) untuk anggaran. Pengiriman yang gagal dicoba lagi pada run cron berikutnya.
- Zona waktu tetap `Asia/Jakarta`.

### 6.5 Real-time

- Gunakan Supabase Realtime untuk daftar belanja dan tugas (kebutuhan sinkronisasi tinggi). Modul keuangan cukup dengan revalidasi saat fokus atau pembaruan optimistis.

### 6.6 Notifikasi Telegram

- Bot dibuat lewat BotFather; token disimpan sebagai secret environment di Vercel.
- Webhook (Route Handler) memvalidasi secret token dari Telegram sebelum memproses pesan.
- Penautan: pengguna membuka bot dan mengirim kode sekali pakai yang dibuat di aplikasi; `chat_id` disimpan di tabel `notification_channels` (kolom `address`); kode penautan disimpan sebagai hash dan kedaluwarsa.
- Peringatan anggaran (80% dan 100%) dikirim saat transaksi disimpan (di Server Action), bukan menunggu cron harian.
- Isi pesan minimal (nama tagihan/pengingat dan tanggal). Hindari saldo atau detail sensitif karena chat bot Telegram tidak terenkripsi end-to-end.
- Kanal notifikasi diabstraksi lewat interface (`NotificationChannel`) agar WhatsApp dapat ditambahkan kemudian tanpa mengubah logika pengingat. WhatsApp dijalankan lewat WAHA (tidak resmi); lihat bagian 8.3.

### 6.7 Visibilitas data

- Seluruh data terlihat dan dapat diubah kedua pihak. Tidak ada mode privat.
- Audit log tetap mencatat siapa mengubah apa.

## 7. Persyaratan non-fungsional

| Aspek | Target |
| --- | --- |
| Kinerja | Halaman utama interaktif \< 2 detik pada 4G; aksi input terasa instan (optimistic UI) |
| Ketersediaan | Best effort (dua pengguna); bergantung pada SLA Supabase dan hosting |
| Keamanan | HTTPS, sesi aman, validasi input di server, otorisasi per household di setiap query, secret (termasuk token bot Telegram) hanya di environment server |
| Privasi | Tanpa data identitas atau rekening penuh pada fase 1 |
| Backup | Satu-satunya backup adalah backup mandiri (paket free Supabase tidak menyediakan backup otomatis): `pg_dump` terjadwal, terenkripsi, disimpan di luar Supabase; uji pemulihan sebelum dipakai nyata. Lihat bagian 8.1 |
| Aksesibilitas | Kontras memadai, target sentuh ≥ 44px, komponen shadcn/ui (basis Radix) |
| Lokalisasi | Bahasa Indonesia, format Rupiah, zona waktu WIB |

## 8. Arsitektur dan tech stack

**Stack:** Next.js (versi stabil terbaru, App Router) + TypeScript · Supabase (PostgreSQL, Auth, Realtime, Storage) · Prisma ORM · shadcn/ui + Tailwind CSS.

> Versi Next.js, Prisma, dan detail konfigurasinya berubah cepat. **Perlu verifikasi terhadap dokumentasi resmi** saat memulai proyek.
> 
> Per 30 September 2026, tag `latest` Prisma di npm menunjuk ke 8.0.0-rc.19 (release candidate), sedangkan skema divalidasi dengan Prisma 7.10.0. Pin versi dan cek ulang saat implementasi.

**Catatan integrasi Prisma + Supabase (penting):**

1. **Connection pooling:** di lingkungan serverless, gunakan URL pooler Supabase (mode transaksi) untuk runtime aplikasi dan URL koneksi langsung untuk migrasi (`DIRECT_URL` di `prisma.config.ts`; validator Prisma terbaru menolak `url`/`directUrl` di `schema.prisma`). Runtime memakai driver adapter (`@prisma/adapter-pg`) dengan URL pooler. Parameter tepatnya perlu diverifikasi di dokumentasi Prisma dan Supabase.
2. **RLS tidak otomatis berlaku:** koneksi Prisma memakai role database langsung, sehingga kebijakan RLS yang ditulis untuk klien Supabase biasanya tidak menjadi penjaga utama. **Otorisasi harus ditegakkan di lapisan aplikasi** (setiap query difilter `household_id` dari sesi, lewat satu data-access layer terpusat). RLS diaktifkan deny-by-default di semua tabel agar anon key tidak bisa menjangkau data lewat Data API, dengan policy SELECT hanya untuk tabel Realtime (`shopping_items`, `tasks`); lihat `constraints.sql`. Pastikan role yang dipakai Prisma memiliki BYPASSRLS (perlu verifikasi di proyek Anda).
3. **Realtime:** Realtime Supabase bekerja lewat klien Supabase (bukan Prisma), dan mengikuti RLS. Pastikan kebijakan RLS untuk tabel yang di-subscribe (belanja, tugas) benar.
4. **Migrasi:** kelola skema lewat Prisma Migrate; hindari mengubah skema manual lewat dashboard agar tidak terjadi drift.
5. **Auth:** Supabase Auth dengan pemetaan `auth.users.id` → tabel `profiles` (tanpa FK ke skema `auth`; baris dibuat aplikasi saat membuat household atau menerima undangan).
6. **BigInt:** nominal bertipe BigInt tidak bisa di-JSON-kan langsung; konversi ke number (aman di bawah 2^53) di lapisan data.
7. **Integritas lintas household:** Prisma tidak memastikan `wallet_id`/`category_id` dari klien milik household yang sama; verifikasi di data-access layer (lihat R8).
8. **Soft delete:** Prisma tidak punya filter global; gunakan client extension atau disiplin filter `deleted_at IS NULL` di data-access layer.
9. **Tanpa service worker:** jangan memasang plugin PWA berbasis service worker. Cukup file manifest (App Router mendukung konvensi `app/manifest.ts`; verifikasi di dokumentasi Next.js yang dipakai) dan ikon.

**Struktur logis:**

- Server Components + Server Actions untuk mutasi; validasi memakai Zod.
- Data-access layer tunggal (`/lib/data`) yang selalu menerima `householdId` dari sesi, tidak pernah dari input klien.
- Vercel Cron memanggil Route Handler harian untuk memproses pengingat dan tagihan (`pg_cron` tidak dipakai agar hanya ada satu mekanisme).
- Hosting: Vercel. Karena serverless, pooler Supabase wajib dipakai untuk koneksi runtime (lihat catatan di atas).
- Notifikasi: Telegram Bot API lewat webhook Route Handler dan abstraksi `NotificationChannel`.

### 8.1 Backup mandiri (pg_dump)

- Jadwal harian lewat job terjadwal (mis. GitHub Actions di repo privat, atau mesin sendiri) yang menjalankan `pg_dump`.
- Hasil dienkripsi (mis. age atau gpg) sebelum diunggah ke penyimpanan privat. Kunci enkripsi disimpan terpisah dari file backup.
- Lokasi penyimpanan dan kunci: belum diputuskan. Usulan minimum: bucket privat di penyedia yang berbeda dari Supabase dan Vercel, dengan kunci di password manager (bukan di repo). Kuota gratis penyedia perlu diverifikasi.
- Retensi usulan: 14 backup harian + 8 mingguan.
- Koneksi langsung Supabase pada konfigurasi tertentu hanya IPv6 sehingga sebagian runner gagal terhubung; session pooler adalah alternatif (perlu verifikasi di dokumentasi Supabase).
- Uji restore ke database kosong sebelum dipakai nyata dan berkala (mis. per kuartal). Backup yang belum pernah diuji restore belum bisa dianggap backup.
- Backup ini satu-satunya salinan di luar Supabase, sehingga backup terenkripsi yang sudah teruji restore menjadi syarat sebelum data keuangan nyata dimasukkan.
- Backup berisi data keuangan; perlakukan sebagai data sensitif.

### 8.2 Batasan free tier

- **Vercel Hobby:** cron sekali sehari dengan presisi sekitar 59 menit (lihat 6.4).
- **Supabase Free** (dikonfirmasi): project dijeda otomatis jika aktivitas database rendah selama seminggu, tanpa backup otomatis, dan database dibatasi 500 MB. Dokumentasi Supabase menyebut beberapa request per hari biasanya cukup mencegah jeda, tetapi itu bukan jaminan. Job harian sebaiknya menjalankan query ringan sebagai keepalive.
- Jika project sempat dijeda, ia dapat dipulihkan dari dashboard, tetapi aplikasi dan pengingat mati selama belum dipulihkan.
- Upgrade ke Supabase Pro (harga perlu dicek) memberi backup harian dan menghilangkan jeda otomatis. Tidak wajib, tetapi patut dipertimbangkan bila backup mandiri terasa merepotkan.

### 8.3 WhatsApp via WAHA (Fase 2)

- WAHA berjalan di atas WhatsApp Web dan tidak didukung resmi oleh WhatsApp/Meta; nomor yang dipakai dapat dibatasi atau diblokir. Ini keputusan yang diambil dengan sadar, dan risikonya diterima.
- Gunakan **nomor khusus** untuk bot, bukan nomor pribadi utama, agar pemblokiran tidak memutus komunikasi pribadi.
- Pola pemakaian berisiko lebih rendah: volume kecil (beberapa pesan per hari), hanya ke dua penerima yang dikenal, dan penerima memulai percakapan dengan nomor bot lebih dulu. Ini praktik umum untuk menekan risiko, bukan jaminan.
- WAHA Core (gratis) mendukung satu sesi WhatsApp dengan engine WEBJS atau NOWEB. Satu sesi cukup untuk kebutuhan ini. NOWEB lebih ringan memori; WEBJS memakai Chromium headless.
- **Hosting:** WAHA membutuhkan container Docker yang berjalan terus dengan penyimpanan persisten untuk sesi, sehingga tidak bisa berjalan di fungsi serverless Vercel. Artinya ada biaya atau perawatan tambahan di luar free tier: VPS/container host (satu sumber pihak ketiga memperkirakan sekitar 2-5 USD per bulan; perlu verifikasi) atau mesin sendiri yang menyala 24 jam.
- **Keamanan:** aktifkan API key WAHA, lindungi dashboard dengan kredensial, dan jangan membukanya tanpa autentikasi. Route Handler Vercel memanggil WAHA lewat HTTPS dengan API key di environment secret. Server WAHA memegang sesi WhatsApp Anda, jadi perlakukan seperti kredensial. Cek opsi pengamanan webhook WAHA sebelum dipakai untuk menerima pesan.
- **Keandalan:** sesi dapat terputus dan perlu pindai QR ulang. Sediakan health check, dan pastikan kegagalan pengiriman WhatsApp tidak menggagalkan pengingat Telegram.
- **Implementasi:** `WahaWhatsAppChannel` mengimplementasikan `NotificationChannel`. Tabel `notification_channels` sudah dibuat sejak awal (bagian 9), sehingga WhatsApp cukup menambah baris dengan channel `WHATSAPP`. Isi pesan tetap minimal, sama seperti Telegram.

## 9. Model data (ringkasan)

Sumber kebenaran: `prisma/schema.prisma` dan `prisma/constraints.sql`. Tabel di bawah hanya ringkasan (16 tabel).

Kolom umum: `id` (uuid, default dari database), `created_at`, `updated_at`, dan `household_id` pada semua tabel data bisnis. `deleted_at` (soft delete) hanya ada di `wallets`, `transactions`, `recurring_bills`, `savings_goals`, dan `reminders`.

| Tabel | Kolom utama |
| --- | --- |
| `households` | name, period_start_day (1-28), ical_token (unik, diisi aplikasi) |
| `profiles` | id (= auth.users.id), household_id, display_name, role (ADMIN/MEMBER) |
| `invitations` | household_id, token_hash (unik), expires_at, used_at, used_by_id, created_by_id |
| `wallets` | name, type (CASH/BANK/EWALLET/OTHER), opening_balance (BigInt); saldo saat ini dihitung dari transaksi |
| `categories` | name, kind (EXPENSE/INCOME), icon, is_archived; unik (household, kind, name) |
| `transactions` | type, amount (BigInt, > 0), category_id?, wallet_id, to_wallet_id?, occurred_on (Date, WIB), note, created_by_id |
| `budgets` | category_id, limit_amount (BigInt; 0 = tanpa batas), effective_from (Date); unik (category, effective_from) |
| `recurring_bills` | name, amount, period (MONTHLY/YEARLY), due_day (1-31), due_month?, remind_days_before (int\[\], default \[3, 0\]), last_paid_due_date?, category_id? |
| `savings_goals` | name, target_amount, saved_amount, deadline? |
| `shopping_lists` | name, is_archived |
| `shopping_items` | list_id, household_id (denormalisasi untuk Realtime/RLS), name, quantity?, checked, checked_by_id?, checked_at?, sort_order |
| `tasks` | title, assignee_id?, due_date?, recurrence (NONE/DAILY/WEEKLY/MONTHLY/YEARLY), done_at? |
| `reminders` | title, due_date, recurrence, remind_days_before (int\[\], default \[30, 7, 0\]), note?, done_at? |
| `notification_channels` | profile_id, channel (TELEGRAM/WHATSAPP), address?, link_code_hash?, link_code_expires_at?, linked_at?, is_active; unik (profile, channel) |
| `notification_logs` | profile_id, channel, entity_type (BILL/REMINDER/BUDGET), entity_id, due_date, slot, status (SENT/FAILED), attempts, last_error?, sent_at?; unik (profile, channel, entity_type, entity_id, due_date, slot) |
| `audit_logs` | actor_id?, entity, entity_id, action (CREATE/UPDATE/DELETE), diff (JSON); append-only lewat trigger |

**Catatan desain:**

- Nominal bilangan bulat rupiah bertipe BigInt; `amount` selalu positif dan arah ditentukan oleh `type`.
- Saldo dompet tidak disimpan; dihitung dari `opening_balance` + transaksi aktif.
- Tanggal bisnis (`occurred_on`, `due_date`, `effective_from`) bertipe Date tanpa jam. Saat menulis dari aplikasi, buat Date dari tanggal WIB sebagai UTC tengah malam.
- `due_day` 29-31 pada bulan yang lebih pendek memakai hari terakhir bulan itu.
- `notification_logs.entity_id` dan `audit_logs.entity_id` bersifat polimorfik, tanpa FK.
- `shopping_items.household_id` harus sama dengan `household_id` daftar induknya; dijaga di aplikasi.
- CHECK constraint, trigger append-only, dan RLS ada di `constraints.sql`, bukan di Prisma. File itu belum diuji terhadap database nyata.
- Indeks utama: `(household_id, occurred_on DESC)` dan `(household_id, category_id, occurred_on)` pada transaksi.

## 10. Alur pengguna utama

1. **Catat pengeluaran:** buka aplikasi → tombol "+" → isi jumlah → pilih kategori → simpan.
2. **Cek anggaran:** beranda menampilkan sisa per kategori dan peringatan.
3. **Tagihan jatuh tempo:** pengingat masuk di Telegram → buka aplikasi → tandai "sudah bayar" (opsional otomatis membuat transaksi).
4. **Belanja:** salah satu menambah item; yang lain mencentang saat di toko.

## 11. Metrik sukses (usulan, bukan angka dari data)

Dievaluasi 4-8 minggu setelah pemakaian:

- Kedua pengguna aktif ≥ 3 hari/minggu.
- ≥ 80% pengeluaran harian tercatat (estimasi subjektif pasangan).
- Nol tagihan atau pajak terlewat sejak pengingat aktif.
- Waktu input transaksi rata-rata \< 10 detik (diukur manual atau lewat log).

**Sinyal berhenti/pivot:** salah satu pengguna tidak memakai selama 3 minggu berturut-turut. Tinjau penyebabnya sebelum menambah fitur.

## 12. Roadmap usulan (kerja paruh waktu, estimasi kasar)

| Tahap | Isi | Estimasi |
| --- | --- | --- |
| 0 (opsional) | Validasi kebiasaan lewat spreadsheet bersama; finalisasi kategori dan anggaran. Dilewati jika pasangan tidak dilibatkan sebelum coding | 2-4 minggu |
| 1 | Fondasi: auth, household, undangan, layout mobile-first + manifest, data-access layer, skema Prisma + `constraints.sql`, backup mandiri + uji restore | 2 minggu |
| 2 | Transaksi, dompet, kategori, ringkasan | 2-3 minggu |
| 3 | Anggaran periode custom dan tagihan berulang | 2 minggu |
| 4 | Belanja dan tugas (real-time) | 1-2 minggu |
| 5 | Telegram bot (penautan, pengingat), pengingat dokumen, iCal, ekspor CSV, audit log | 2 minggu |
| 6 | Pemakaian nyata 4-8 minggu, lalu evaluasi metrik | 4-8 minggu |
| Fase 2 | WhatsApp via WAHA, setelah Telegram stabil dan terpakai | 1 minggu (di luar hosting WAHA) |

## 13. Keputusan dan open questions

### Keputusan (30 September 2026)

| Topik | Keputusan | Dampak |
| --- | --- | --- |
| Privasi | Tidak ada transaksi privat; semua data bersama | Mode `PRIVATE` dihapus; lihat R5 |
| Periode anggaran | Custom, satu tanggal mulai per household (`period_start_day`) | Bagian 6.3 |
| Kanal pengingat | Telegram bot dulu (kedua pihak bersedia) | Bagian 6.6 |
| WhatsApp | Lewat WAHA (tidak resmi), Fase 2 | Bagian 8.3; risiko R7; butuh server sendiri |
| Hosting | Vercel free tier (Hobby) | Cron sekali sehari; bagian 6.4 dan 8.2 |
| Database | Supabase Free | Jeda otomatis dan tanpa backup; R6, bagian 8.2 |
| Keterlibatan pasangan | Tidak dilibatkan sebelum coding | Risiko R1 naik |
| Backup | Mandiri (`pg_dump`); lokasi belum diputuskan | Bagian 8.1; syarat sebelum data nyata |
| Skema data | Enam perubahan dari skema Prisma disetujui (1 Oktober 2026) | Bagian 9; versi 0.5 |
| Mode aplikasi | Web app mobile-first dengan manifest; tanpa service worker/PWA offline (alasan: PWA sulit diperbarui di browser HP) | Bagian 5.4 dan 8; butuh koneksi saat dipakai |

### Open questions

1. Tanggal awal periode anggaran (1-28). Ini hanya pengaturan, tidak menghambat pengembangan.
2. Lokasi backup terenkripsi dan kunci enkripsi. **Harus diputuskan sebelum data keuangan nyata dimasukkan.**
3. Tempat menjalankan WAHA (VPS/container host atau mesin sendiri) dan nomor WhatsApp khusus untuk bot. Bisa ditunda sampai Fase 2.
4. Apakah Telegram tetap kanal utama dan WhatsApp hanya tambahan? Disarankan ya, karena Telegram memakai Bot API resmi.

## 14. Riwayat versi

**v0.6 (1 Oktober 2026)**: service worker dan PWA offline dikeluarkan dari lingkup; web app mobile-first dengan manifest saja.

**v0.5 (1 Oktober 2026)**: disinkronkan dengan `prisma/schema.prisma`. Enam perubahan dari v0.4:

1. `wallets.balance` menjadi `opening_balance`; saldo saat ini dihitung dari transaksi.
2. `transactions.occurred_at` menjadi `occurred_on` bertipe Date (tanggal WIB).
3. `budgets.month` menjadi `effective_from`; batas berlaku sampai diubah.
4. Tabel baru `invitations` (token di-hash, kedaluwarsa, sekali pakai).
5. Tabel baru `notification_logs` (kunci idempotensi per penerima, kanal, entitas, tanggal, dan slot).
6. `telegram_links` diganti `notification_channels` sejak awal.

Tambahan yang menyertai: risiko R8 (referensi lintas household), RLS deny-by-default, catatan versi Prisma dan driver adapter, serta kolom tambahan pada `recurring_bills` dan `reminders` (`remind_days_before` bertipe array, `last_paid_due_date`, `done_at`).

**v0.4**: Supabase free dan WAHA. **v0.3**: batas free tier dan backup mandiri. **v0.2**: keputusan awal. **v0.1**: draft pertama.