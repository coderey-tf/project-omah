export interface TelegramSendMessagePayload {
  chatId: string;
  text: string;
  parseMode?: "HTML" | "MarkdownV2" | "Markdown";
}

export async function sendTelegramMessage({
  chatId,
  text,
  parseMode = "HTML",
}: TelegramSendMessagePayload): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || token.includes("placeholder") || token === "bot-token") {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN belum dikonfigurasi, pesan diabaikan:", text);
    return { ok: false, error: "Token bot Telegram belum diset di environment" };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.error("[Telegram Error]", data);
      return { ok: false, error: data.description || "Gagal mengirim pesan Telegram" };
    }

    return { ok: true };
  } catch (err: any) {
    console.error("[Telegram Exception]", err);
    return { ok: false, error: err.message || "Network error" };
  }
}

export function formatBillTelegramMessage({
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
  const urgencyIcon = daysRemaining === 0 ? "🚨 <b>HARI INI JATUH TEMPO!</b>" : `⏳ <b>Jatuh tempo dalam ${daysRemaining} hari</b>`;
  return [
    `☕ <b>Omah — Pengingat Tagihan Rumah</b>`,
    `<i>Rumah Tangga: ${householdName}</i>`,
    ``,
    urgencyIcon,
    `🏷️ Tagihan: <b>${billName}</b>`,
    `💰 Nominal: <b>${amountFormatted}</b>`,
    `📅 Tanggal: ${dueDateFormatted}`,
    ``,
    `<i>Buka aplikasi Omah untuk mencatat pembayaran dan memperbarui saldo kas.</i>`,
  ].join("\n");
}

export function formatBudgetTelegramMessage({
  householdName,
  categoryName,
  percentage,
  spentFormatted,
  limitFormatted,
}: {
  householdName: string;
  categoryName: string;
  percentage: number;
  spentFormatted: string;
  limitFormatted: string;
}): string {
  const icon = percentage >= 100 ? "🛑 <b>ANGGARAN TERLEWATI!</b>" : "⚠️ <b>PERINGATAN ANGGARAN (80%)</b>";
  return [
    `☕ <b>Omah — Peringatan Anggaran</b>`,
    `<i>Rumah Tangga: ${householdName}</i>`,
    ``,
    icon,
    `📁 Kategori: <b>${categoryName}</b>`,
    `📊 Pemakaian: <b>${percentage}%</b> (${spentFormatted} dari ${limitFormatted})`,
    ``,
    `<i>Harap pertimbangkan pengeluaran berikutnya untuk kategori ini hingga awal periode berikutnya.</i>`,
  ].join("\n");
}

export function formatReminderTelegramMessage({
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
  const urgencyIcon =
    daysRemaining === 0
      ? "🚨 <b>HARI INI JATUH TEMPO DOKUMEN!</b>"
      : `⏳ <b>Jatuh tempo dalam ${daysRemaining} hari</b>`;
  return [
    `☕ <b>Omah — Pengingat Dokumen & Tenggat</b>`,
    `<i>Rumah Tangga: ${householdName}</i>`,
    ``,
    urgencyIcon,
    `📄 Dokumen: <b>${title}</b>`,
    `📅 Batas Tenggat: ${dueDateFormatted}`,
    note ? `📝 Catatan: <i>${note}</i>` : ``,
    ``,
    `<i>Buka aplikasi Omah untuk memperbarui atau menandai dokumen ini telah diurus.</i>`,
  ]
    .filter(Boolean)
    .join("\n");
}

