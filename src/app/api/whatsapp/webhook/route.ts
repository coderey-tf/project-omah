import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWahaWhatsAppMessage } from "@/lib/notifications/waha";
import { formatRupiah } from "@/lib/utils";
import { NotificationChannelType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check WAHA event
    // WAHA event can be "message" or "message.any"
    const event = body.event;
    const payload = body.payload;

    if (!payload || payload.fromMe) {
      return NextResponse.json({ ok: true });
    }

    const rawFrom = payload.from || "";
    const rawText = (payload.body || "").trim();

    if (!rawFrom || !rawText) {
      return NextResponse.json({ ok: true });
    }

    // Extract pure phone number
    const cleanPhone = rawFrom.replace("@c.us", "").replace(/\D/g, "");

    // Find linked notification channel for this phone
    const channel = await prisma.notificationChannel.findFirst({
      where: {
        channel: NotificationChannelType.WHATSAPP,
        address: cleanPhone,
        isActive: true,
      },
      include: {
        profile: {
          include: { household: true },
        },
      },
    });

    const command = rawText.toLowerCase().split(" ")[0];

    // If channel not linked yet
    if (!channel) {
      // If unauthorized number texts the bot
      console.warn(`[WAHA Webhook] Pesan dari nomor tidak dikenal: ${cleanPhone}`);
      return NextResponse.json({ ok: true });
    }

    const household = channel.profile.household;
    const memberName = channel.profile.displayName;

    // 1. /saldo command
    if (command === "/saldo" || command === "saldo") {
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

        return `• *${w.name}*: ${formatRupiah(bal)}`;
      });

      const reply = [
        `☕ *Saldo Dompet Rumah Tangga*`,
        `_Keluarga: ${household.name}_`,
        ``,
        ...walletLines,
        ``,
        `💳 *Total Saldo Kas: ${formatRupiah(total)}*`,
      ].join("\n");

      await sendWahaWhatsAppMessage({ phone: cleanPhone, text: reply });
      return NextResponse.json({ ok: true });
    }

    // 2. /tagihan command
    if (command === "/tagihan" || command === "tagihan") {
      const bills = await prisma.recurringBill.findMany({
        where: { householdId: household.id, deletedAt: null },
        orderBy: { dueDay: "asc" },
      });

      if (bills.length === 0) {
        await sendWahaWhatsAppMessage({
          phone: cleanPhone,
          text: `☕ Tidak ada tagihan rutin yang terdaftar di ${household.name}.`,
        });
        return NextResponse.json({ ok: true });
      }

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const billLines = bills.map((b) => {
        let isPaid = false;
        if (b.lastPaidDueDate) {
          const lpd = new Date(b.lastPaidDueDate);
          if (b.period === "MONTHLY") {
            isPaid = lpd.getFullYear() === currentYear && lpd.getMonth() === currentMonth;
          } else {
            isPaid = lpd.getFullYear() === currentYear;
          }
        }

        const status = isPaid ? "✅ *Lunas*" : "⏳ *Belum Bayar*";
        return `• *${b.name}*: ${formatRupiah(Number(b.amount))} (Tgl ${b.dueDay}) — ${status}`;
      });

      const reply = [
        `☕ *Daftar Tagihan Rumah Tangga*`,
        `_Bulan Ini • ${household.name}_`,
        ``,
        ...billLines,
      ].join("\n");

      await sendWahaWhatsAppMessage({ phone: cleanPhone, text: reply });
      return NextResponse.json({ ok: true });
    }

    // 3. /tugas command
    if (command === "/tugas" || command === "tugas") {
      const tasks = await prisma.task.findMany({
        where: { householdId: household.id, doneAt: null },
        include: { assignee: true },
        take: 10,
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      });

      if (tasks.length === 0) {
        await sendWahaWhatsAppMessage({
          phone: cleanPhone,
          text: `☕ *Hore!* Tidak ada tugas rumah tangga yang tertunda saat ini. Semuanya beres! 🎉`,
        });
        return NextResponse.json({ ok: true });
      }

      const taskLines = tasks.map((t) => {
        const pic = t.assignee ? ` (${t.assignee.displayName})` : "";
        const due = t.dueDate ? ` • Tgl ${new Date(t.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` : "";
        return `⬜ *${t.title}*${pic}${due}`;
      });

      const reply = [
        `☕ *Tugas Rumah Tangga Tertunda*`,
        `_Keluarga: ${household.name}_`,
        ``,
        ...taskLines,
      ].join("\n");

      await sendWahaWhatsAppMessage({ phone: cleanPhone, text: reply });
      return NextResponse.json({ ok: true });
    }

    // 4. /belanja command
    if (command === "/belanja" || command === "belanja") {
      const items = await prisma.shoppingItem.findMany({
        where: { householdId: household.id, checked: false },
        take: 12,
        orderBy: { sortOrder: "asc" },
      });

      if (items.length === 0) {
        await sendWahaWhatsAppMessage({
          phone: cleanPhone,
          text: `☕ Daftar belanja kosong atau semua kebutuhan sudah terbeli! ✨`,
        });
        return NextResponse.json({ ok: true });
      }

      const itemLines = items.map((i) => `• ${i.name}${i.quantity ? ` (${i.quantity})` : ""}`);

      const reply = [
        `🛒 *Daftar Belanja Rumah Tangga*`,
        `_Keluarga: ${household.name}_`,
        ``,
        ...itemLines,
      ].join("\n");

      await sendWahaWhatsAppMessage({ phone: cleanPhone, text: reply });
      return NextResponse.json({ ok: true });
    }

    // 5. Default / Help
    const helpReply = [
      `☕ *Omahku System — Asisten WhatsApp Keluarga*`,
      `Halo *${memberName}*, berikut perintah cepat yang dapat Anda gunakan:`,
      ``,
      `• */saldo* — Cek saldo kas & rekening aktif`,
      `• */tagihan* — Cek tagihan jatuh tempo bulan ini`,
      `• */tugas* — Cek tugas rumah yang belum selesai`,
      `• */belanja* — Cek daftar belanja dapur/pasar`,
      `• */bantuan* — Panduan penggunaan bot`,
    ].join("\n");

    await sendWahaWhatsAppMessage({ phone: cleanPhone, text: helpReply });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[WAHA Webhook Error]", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
