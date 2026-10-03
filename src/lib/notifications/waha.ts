export interface WahaSendMessagePayload {
  phone: string;
  text: string;
}

export async function sendWahaWhatsAppMessage({
  phone,
  text,
}: WahaSendMessagePayload): Promise<{ ok: boolean; error?: string }> {
  const baseUrl = process.env.WAHA_BASE_URL || "http://localhost:3008";
  const apiKey = process.env.WAHA_API_KEY;

  if (!phone) {
    return { ok: false, error: "Nomor WhatsApp belum ditentukan" };
  }

  // Format phone number to WhatsApp chatId (e.g. 628123456789@c.us)
  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.slice(1);
  }
  const chatId = cleanPhone.includes("@c.us") ? cleanPhone : `${cleanPhone}@c.us`;

  try {
    const url = `${baseUrl.replace(/\/$/, "")}/api/sendText`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["X-Api-Key"] = apiKey;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        chatId,
        text,
        session: "default",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[WAHA Error] HTTP ${res.status}: ${errText}`);
      return { ok: false, error: `WAHA returned HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (err: any) {
    console.warn("[WAHA Exception] Gagal terhubung ke server WAHA:", err.message);
    return { ok: false, error: err.message || "WAHA connection error" };
  }
}

export function formatBillWhatsAppMessage({
  householdName,
  billName,
  amountFormatted,
  dueDateFormatted,
  daysRemaining,
}: {
  householdName: string;
  billName: string;
  amountFormatted: string;
  dueDateFormatted: string;
  daysRemaining: number;
}): string {
  const urgency = daysRemaining === 0 ? "🚨 *HARI INI JATUH TEMPO!*" : `⏳ *Jatuh tempo dalam ${daysRemaining} hari*`;
  return [
    `☕ *Omah — Pengingat Tagihan Rumah*`,
    `_Keluarga: ${householdName}_`,
    ``,
    urgency,
    `📌 *Tagihan:* ${billName}`,
    `💰 *Nominal:* ${amountFormatted}`,
    `📅 *Jatuh Tempo:* ${dueDateFormatted}`,
    ``,
    `Buka Omah untuk konfirmasi pembayaran:`,
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}`,
  ].join("\n");
}

export function formatReminderWhatsAppMessage({
  householdName,
  title,
  dueDateFormatted,
  daysRemaining,
  note,
}: {
  householdName: string;
  title: string;
  dueDateFormatted: string;
  daysRemaining: number;
  note?: string | null;
}): string {
  const urgency = daysRemaining === 0 ? "🚨 *HARI INI JATUH TEMPO!*" : `⏳ *Jatuh tempo dalam ${daysRemaining} hari*`;
  return [
    `☕ *Omah — Pengingat Berkas & Jatuh Tempo*`,
    `_Keluarga: ${householdName}_`,
    ``,
    urgency,
    `📄 *Pengingat:* ${title}`,
    `📅 *Batas Waktu:* ${dueDateFormatted}`,
    note ? `📝 *Catatan:* ${note}` : "",
    ``,
    `Buka Omah: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}`,
  ].filter(Boolean).join("\n");
}
