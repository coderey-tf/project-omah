import { LoginForm } from "./login-form";

export const metadata = {
  title: "Masuk — Omahku Sistem Rumah Tangga",
  description: "Masuk ke sistem manajemen rumah tangga privat Omahku",
};

export default function LoginPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured = Boolean(
    supabaseUrl && supabaseAnonKey && supabaseAnonKey !== "placeholder-anon-key"
  );

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <LoginForm isConfigured={isConfigured} />
    </div>
  );
}
