-- =============================================================================
-- constraints.sql - pelengkap schema.prisma (hal yang tidak bisa ditulis di Prisma)
--
-- CARA PAKAI
--   1. npx prisma migrate dev --create-only --name extra_constraints
--   2. Tempel isi file ini ke migration.sql yang dibuat
--   3. npx prisma migrate dev
--
-- STATUS: BELUM dijalankan terhadap database nyata (sandbox tanpa Postgres).
-- Uji dulu di database uji/proyek Supabase kosong sebelum dipakai.
-- Nama tabel dan kolom mengikuti @@map / @map di schema.prisma.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CHECK constraint
-- -----------------------------------------------------------------------------

ALTER TABLE households
  ADD CONSTRAINT households_period_start_day_chk
  CHECK (period_start_day BETWEEN 1 AND 28);

ALTER TABLE transactions
  ADD CONSTRAINT transactions_amount_positive_chk
  CHECK (amount > 0);

-- TRANSFER: wajib punya dompet tujuan berbeda dan tanpa kategori.
-- Selain TRANSFER: wajib punya kategori dan tanpa dompet tujuan.
ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_shape_chk
  CHECK (
    (type = 'TRANSFER'
       AND to_wallet_id IS NOT NULL
       AND to_wallet_id <> wallet_id
       AND category_id IS NULL)
    OR
    (type <> 'TRANSFER'
       AND to_wallet_id IS NULL
       AND category_id IS NOT NULL)
  );

ALTER TABLE budgets
  ADD CONSTRAINT budgets_limit_nonneg_chk
  CHECK (limit_amount >= 0);

ALTER TABLE recurring_bills
  ADD CONSTRAINT recurring_bills_amount_positive_chk CHECK (amount > 0),
  ADD CONSTRAINT recurring_bills_due_day_chk CHECK (due_day BETWEEN 1 AND 31),
  ADD CONSTRAINT recurring_bills_due_month_chk
    CHECK (due_month IS NULL OR due_month BETWEEN 1 AND 12),
  ADD CONSTRAINT recurring_bills_yearly_needs_month_chk
    CHECK (period = 'MONTHLY' OR due_month IS NOT NULL);

ALTER TABLE savings_goals
  ADD CONSTRAINT savings_goals_target_positive_chk CHECK (target_amount > 0),
  ADD CONSTRAINT savings_goals_saved_nonneg_chk CHECK (saved_amount >= 0);

-- -----------------------------------------------------------------------------
-- 2. Audit log append-only
--    - UPDATE ditolak, kecuali satu-satunya perubahan adalah actor_id -> NULL
--      (dibutuhkan agar ON DELETE SET NULL saat profil dihapus tetap jalan).
--    - DELETE ditolak, kecuali sesi menyetel app.allow_audit_purge = 'on'.
--      Menghapus household (cascade) butuh:
--        BEGIN; SET LOCAL app.allow_audit_purge = 'on'; DELETE FROM households ...; COMMIT;
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION audit_logs_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.actor_id IS NULL
       AND (to_jsonb(NEW) - 'actor_id') = (to_jsonb(OLD) - 'actor_id') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'audit_logs bersifat append-only (UPDATE ditolak)';
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF current_setting('app.allow_audit_purge', true) = 'on' THEN
      RETURN OLD;
    END IF;
    RAISE EXCEPTION 'audit_logs bersifat append-only (DELETE ditolak)';
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_logs_guard_trg
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_guard();

-- -----------------------------------------------------------------------------
-- 3. RLS deny-by-default di SEMUA tabel
--    Alasan: Supabase dapat mengekspos skema public lewat Data API (PostgREST).
--    Tabel tanpa RLS yang memiliki grant ke anon/authenticated bisa dibaca atau
--    ditulis memakai anon key. Mengaktifkan RLS tanpa policy = akses lewat
--    Data API ditolak. Koneksi Prisma memakai role database langsung, jadi
--    tidak terpengaruh HANYA jika role itu punya BYPASSRLS (role postgres di
--    Supabase umumnya punya). PERLU VERIFIKASI di proyek Anda:
--      SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname = current_user;
--    Jika hasilnya false, Prisma akan ikut terblokir dan Anda perlu role/policy
--    khusus.
-- -----------------------------------------------------------------------------

ALTER TABLE households            ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_bills       ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists        ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS _prisma_migrations    ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 4. Realtime (hanya belanja dan tugas): izinkan SELECT untuk anggota household
--    Mutasi tetap lewat Server Action + Prisma; klien hanya mendengarkan.
--    Fungsi SECURITY DEFINER menghindari rekursi RLS pada tabel profiles.
-- -----------------------------------------------------------------------------

-- Pastikan schema auth, role authenticated/anon, dan publication supabase_realtime ada (terutama untuk shadow database)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    EXECUTE 'CREATE SCHEMA auth';
    EXECUTE 'CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$ SELECT null::uuid $fn$';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.current_household_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.profiles WHERE id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_household_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_household_id() TO authenticated;

CREATE POLICY shopping_items_select_own_household
  ON shopping_items FOR SELECT TO authenticated
  USING (household_id = public.current_household_id());

CREATE POLICY tasks_select_own_household
  ON tasks FOR SELECT TO authenticated
  USING (household_id = public.current_household_id());

-- Daftarkan tabel ke publikasi Realtime (nama publikasi bawaan Supabase;
-- verifikasi di proyek Anda).
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE shopping_items, tasks;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 5. Opsional: indeks parsial untuk transaksi aktif (query harian umumnya
--    memfilter deleted_at IS NULL). Indeks biasa dari Prisma sudah cukup untuk
--    dua pengguna; tambahkan hanya jika terbukti perlu.
-- -----------------------------------------------------------------------------
-- CREATE INDEX transactions_active_household_date_idx
--   ON transactions (household_id, occurred_on DESC) WHERE deleted_at IS NULL;
