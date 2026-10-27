import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import { formatRupiah } from "@/lib/utils";
import { NotificationChannelType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify Telegram webhook secret token
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (webhookSecret) {
      const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
      if (headerSecret !== webhookSecret) {
        console.warn("[Telegram Webhook] Invalid or missing secret token");
        return NextResponse.json({ ok: false }, { status: 401 });
      }
    }

    const body = await request.json();

    const message = body.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = message.text.trim();

    // Check if channel is already linked to a profile
    let channel = await prisma.notificationChannel.findFirst({
      where: {
        channel: NotificationChannelType.TELEGRAM,
        address: chatId,
      },
      include: {
        profile: {
          include: { household: true },
        },
      },
    });

    // 1. Check if input is a linking code (/start <CODE> or directly sending 6-char hex code like 879EEE)
    let linkCode: string | null = null;
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      if (parts[1]?.trim()) {
        linkCode = parts[1].trim().toUpperCase();
      }
    } else if (/^[A-Za-z0-9]{6}$/.test(text)) {
      linkCode = text.trim().toUpperCase();
    }

    if (linkCode) {
      // Link to profile with this code
      const targetChannel = await prisma.notificationChannel.findFirst({
        where: {
          channel: NotificationChannelType.TELEGRAM,
          linkCodeHash: linkCode,
          OR: [
            { linkCodeExpiresAt: null },
            { linkCodeExpiresAt: { gte: new Date() } },
          ],
        },
        include: { profile: { include: { household: true } } },
      });

      if (targetChannel) {
        await prisma.notificationChannel.update({
          where: { id: targetChannel.id },
          data: {
            address: chatId,
            linkedAt: new Date(),
            linkCodeHash: null,
            linkCodeExpiresAt: null,
            isActive: true,
          },
        });

        await sendTelegramMessage({
          chatId,
          text: [
            `☕ <b>Akun Telegram Berhasil Ditautkan!</b>`,
            `Halo <b>${targetChannel.profile.displayName}</b>, akun Anda kini terhubung ke rumah tangga <b>${targetChannel.profile.household.name}</b>.`,
            ``,
            `Anda akan menerima pengingat otomatis untuk tagihan, belanja, dan tugas rumah.`,
            `Ketik /saldo, /tagihan, atau /tugas untuk cek status cepat kapan saja!`,
          ].join("\n"),
        });

        return NextResponse.json({ ok: true });
      } else {
        await sendTelegramMessage({
          chatId,
          text: `⚠️ Kode penautan <b>${linkCode}</b> tidak valid atau sudah kedaluwarsa. Silakan buat kode baru melalui menu Pengaturan di aplikasi Omahku.`,
        });
        return NextResponse.json({ ok: true });
      }
    }

    // 2. /start without code
    if (text.startsWith("/start")) {

      // If not linked, instruct user to use a linking code from the app
      if (!channel) {
        await sendTelegramMessage({
          chatId,
          text: [
            `☕ <b>Selamat Datang di Bot Omahku System!</b>`,
            ``,
            `Untuk menghubungkan akun Telegram Anda, silakan buat kode penautan melalui menu <b>Pengaturan → Notifikasi</b> di aplikasi Omahku.`,
            ``,
            `Kirim kode 6 karakter tersebut ke sini, atau klik tautan yang diberikan di aplikasi.`,
          ].join("\n"),
        });
        return NextResponse.json({ ok: true });
      }

      await sendTelegramMessage({
        chatId,
        text: `☕ <b>Omahku System</b>\n\nKetik /saldo, /tagihan, atau /tugas untuk melihat data rumah tangga Anda.`,
      });
      return NextResponse.json({ ok: true });
    }

    // 2. /saldo command
    if (text === "/saldo") {
      const household = channel?.profile.household || (await prisma.household.findFirst());
      if (!household) {
        await sendTelegramMessage({ chatId, text: "Rumah tangga belum terdaftar." });
        return NextResponse.json({ ok: true });
      }

      const wallets = await prisma.wallet.findMany({
        where: { householdId: household.id, deletedAt: null },
        include: {
          txFrom: { where: { deletedAt: null }, select: { type: true, amount: true } },
          txTo: { where: { deletedAt: null }, select: { amount: true } },
        },
      });

      let total = 0;
      const walletLines = wallets.map((w) => {
        let bal = Number(w.openingBalance);
        for (const t of w.txFrom) {
          if (t.type === "INCOME") bal += Number(t.amount);
          if (t.type === "EXPENSE") bal -= Number(t.amount);
          if (t.type === "TRANSFER") bal -= Number(t.amount);
        }
        for (const t of w.txTo) bal += Number(t.amount);
        total += bal;

        return `• <b>${w.name}</b>: ${formatRupiah(bal)}`;
      });

      const reply = [
        `☕ <b>Saldo Dompet Rumah Tangga</b>`,
        `<i>${household.name}</i>`,
        ``,
        ...walletLines,
        ``,
        `💳 <b>Total Saldo: ${formatRupiah(total)}</b>`,
      ].join("\n");

      await sendTelegramMessage({ chatId, text: reply });
      return NextResponse.json({ ok: true });
    }

    // 3. /tagihan command
    if (text === "/tagihan") {
      const household = channel?.profile.household || (await prisma.household.findFirst());
      if (!household) {
        await sendTelegramMessage({ chatId, text: "Rumah tangga belum terdaftar." });
        return NextResponse.json({ ok: true });
      }

      const bills = await prisma.recurringBill.findMany({
        where: { householdId: household.id, deletedAt: null },
        orderBy: { dueDay: "asc" },
      });

      const now = new Date();
      const currentDay = now.getDate();

      const billLines = bills.map((b) => {
        let diff = b.dueDay - currentDay;
        if (diff < 0) diff += 30;
        const status = diff === 0 ? "🚨 Hari Ini!" : `⏳ ${diff} hari lagi`;
        return `• <b>${b.name}</b>: ${formatRupiah(Number(b.amount))} (tgl ${b.dueDay} — ${status})`;
      });

      const reply = [
        `☕ <b>Daftar Tagihan Berulang</b>`,
        `<i>${household.name}</i>`,
        ``,
        bills.length > 0 ? billLines.join("\n") : "Tidak ada tagihan aktif terdaftar.",
      ].join("\n");

      await sendTelegramMessage({ chatId, text: reply });
      return NextResponse.json({ ok: true });
    }

    // 4. /tugas command
    if (text === "/tugas") {
      const household = channel?.profile.household || (await prisma.household.findFirst());
      if (!household) {
        await sendTelegramMessage({ chatId, text: "Rumah tangga belum terdaftar." });
        return NextResponse.json({ ok: true });
      }

      const tasks = await prisma.task.findMany({
        where: { householdId: household.id, doneAt: null },
        orderBy: { dueDate: "asc" },
        include: { assignee: { select: { displayName: true } } },
      });

      const taskLines = tasks.map((t) => {
        const pj = t.assignee?.displayName || "Bersama";
        const due = t.dueDate
          ? t.dueDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
          : "Fleksibel";
        return `• <b>${t.title}</b> (PJ: ${pj}, ${due})`;
      });

      const reply = [
        `☕ <b>Tugas Rumah Belum Selesai</b>`,
        `<i>${household.name}</i>`,
        ``,
        tasks.length > 0 ? taskLines.join("\n") : "Semua tugas rumah sudah selesai! 🎉",
      ].join("\n");

      await sendTelegramMessage({ chatId, text: reply });
      return NextResponse.json({ ok: true });
    }

    // 5. Default / Help
    await sendTelegramMessage({
      chatId,
      text: [
        `☕ <b>Omahku System Bot</b>`,
        `Perintah:`,
        `/saldo — Cek saldo seluruh dompet & rekening`,
        `/tagihan — Cek tagihan jatuh tempo bulan ini`,
        `/tugas — Cek daftar tugas rumah tangga`,
      ].join("\n"),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Telegram Webhook Error]", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
