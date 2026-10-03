import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import { formatRupiah } from "@/lib/utils";
import { NotificationChannelType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
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

    // 1. /start command
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const linkCode = parts[1]?.trim();

      if (linkCode) {
        // Link to profile with this code
        const targetChannel = await prisma.notificationChannel.findFirst({
          where: {
            channel: NotificationChannelType.TELEGRAM,
            linkCodeHash: linkCode,
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
        }
      }

      // If no code or already linked or first time
      if (!channel) {
        // Auto-link to default admin profile if single household demo
        const defaultHousehold = await prisma.household.findFirst({
          include: { profiles: true },
        });

        if (defaultHousehold && defaultHousehold.profiles.length > 0) {
          const profile = defaultHousehold.profiles[0];
          await prisma.notificationChannel.upsert({
            where: {
              profileId_channel: {
                profileId: profile.id,
                channel: NotificationChannelType.TELEGRAM,
              },
            },
            create: {
              profileId: profile.id,
              channel: NotificationChannelType.TELEGRAM,
              address: chatId,
              linkedAt: new Date(),
              isActive: true,
            },
            update: {
              address: chatId,
              linkedAt: new Date(),
              isActive: true,
            },
          });

          await sendTelegramMessage({
            chatId,
            text: [
              `☕ <b>Selamat Datang di Bot Omah System!</b>`,
              `Halo <b>${profile.displayName}</b>, bot telah terhubung dengan <b>${defaultHousehold.name}</b>.`,
              ``,
              `<b>Perintah yang tersedia:</b>`,
              `• /saldo — Cek total saldo kas & rekening aktif`,
              `• /tagihan — Cek tagihan jatuh tempo bulan ini`,
              `• /tugas — Cek daftar tugas rumah yang belum selesai`,
              `• /help — Bantuan perintah`,
            ].join("\n"),
          });

          return NextResponse.json({ ok: true });
        }
      }

      await sendTelegramMessage({
        chatId,
        text: `☕ <b>Omah System</b>\n\nKetik /saldo, /tagihan, atau /tugas untuk melihat data rumah tangga Anda.`,
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
        `☕ <b>Omah System Bot</b>`,
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
