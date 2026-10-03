// prisma.config.ts (letakkan di root proyek, sejajar package.json)
// Dipakai Prisma CLI (migrate, db pull, dll). Untuk migrasi gunakan koneksi
// LANGSUNG Supabase (DIRECT_URL), bukan pooler transaksi.
// PERLU VERIFIKASI terhadap dokumentasi versi Prisma yang Anda pasang.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
