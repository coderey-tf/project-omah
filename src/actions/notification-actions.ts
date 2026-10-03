"use server";

import { prisma } from "@/lib/prisma";
import { NotificationChannelType } from "@prisma/client";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import { sendWahaWhatsAppMessage } from "@/lib/notifications/waha";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

/**
 * 1. Buat kode sekali pakai (OTP / deep link) untuk penautan bot Telegram
 */
export async function generateTelegramLinkCodeAction(profileId: string) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { household: true },
    });

    if (!profile) {
      return { success: false, error: "Profil anggota tidak ditemukan" };
    }

    // Generate 6 digit uppercase alphanumeric code
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

    await prisma.notificationChannel.upsert({
      where: {
        profileId_channel: {
          profileId,
          channel: NotificationChannelType.TELEGRAM,
        },
      },
      create: {
        profileId,
        channel: NotificationChannelType.TELEGRAM,
        linkCodeHash: code,
        linkCodeExpiresAt: expiresAt,
        isActive: true,
      },
      update: {
        linkCodeHash: code,
        linkCodeExpiresAt: expiresAt,
        isActive: true,
      },
    });

    revalidatePath("/settings");

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "OmahBot";

    return {
      success: true,
      code,
      botUsername,
      deepLink: `https://t.me/${botUsername}?start=${code}`,
    };
  } catch (error: any) {
    console.error("Error generating Telegram link code:", error);
    return {
      success: false,
      error: error.message || "Gagal membuat kode penautan Telegram",
    };
  }
}

/**
 * 2. Tautkan nomor WhatsApp (E.164 format) ke profil anggota
 */
export async function linkWhatsAppChannelAction(profileId: string, rawPhone: string) {
  try {
    if (!rawPhone || !rawPhone.trim()) {
      return { success: false, error: "Nomor WhatsApp wajib diisi" };
    }

    // Standardize phone number: remove non-digits
    let cleanPhone = rawPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith("8")) {
      cleanPhone = "62" + cleanPhone;
    }

    if (cleanPhone.length < 9 || cleanPhone.length > 16) {
      return {
        success: false,
        error: "Format nomor WhatsApp tidak valid (contoh: 08123456789 atau 628123456789)",
      };
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { household: true },
    });

    if (!profile) {
      return { success: false, error: "Profil anggota tidak ditemukan" };
    }

    await prisma.notificationChannel.upsert({
      where: {
        profileId_channel: {
          profileId,
          channel: NotificationChannelType.WHATSAPP,
        },
      },
      create: {
        profileId,
        channel: NotificationChannelType.WHATSAPP,
        address: cleanPhone,
        linkedAt: new Date(),
        isActive: true,
      },
      update: {
        address: cleanPhone,
        linkedAt: new Date(),
        isActive: true,
      },
    });

    // Send greeting / welcome message via WAHA
    await sendWahaWhatsAppMessage({
      phone: cleanPhone,
      text: [
        `☕ *Kanal WhatsApp Omah Berhasil Terhubung!*`,
        `Halo *${profile.displayName}*, nomor ini kini terdaftar untuk menerima pengingat harian keluarga *${profile.household.name}*.`,
        ``,
        `Ketik */saldo*, */tagihan*, atau */tugas* kapan saja untuk memeriksa status rumah tangga.`,
      ].join("\n"),
    }).catch(() => {});

    revalidatePath("/settings");
    return { success: true, phone: cleanPhone };
  } catch (error: any) {
    console.error("Error linking WhatsApp channel:", error);
    return {
      success: false,
      error: error.message || "Gagal menautkan nomor WhatsApp",
    };
  }
}

/**
 * 3. Toggle status aktif kanal notifikasi (on/off)
 */
export async function toggleNotificationChannelAction(channelId: string, isActive: boolean) {
  try {
    await prisma.notificationChannel.update({
      where: { id: channelId },
      data: { isActive },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mengubah status kanal notifikasi",
    };
  }
}

/**
 * 4. Putus tautan (unlink) kanal notifikasi
 */
export async function unlinkNotificationChannelAction(channelId: string) {
  try {
    await prisma.notificationChannel.delete({
      where: { id: channelId },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal memutuskan tautan notifikasi",
    };
  }
}

/**
 * 5. Kirim pesan pengujian (Test Notification)
 */
export async function sendTestNotificationAction(channelId: string) {
  try {
    const channel = await prisma.notificationChannel.findUnique({
      where: { id: channelId },
      include: {
        profile: {
          include: { household: true },
        },
      },
    });

    if (!channel || !channel.address) {
      return { success: false, error: "Kanal notifikasi belum terhubung atau nomor/chat ID kosong" };
    }

    const householdName = channel.profile.household.name;
    const recipientName = channel.profile.displayName;

    if (channel.channel === NotificationChannelType.TELEGRAM) {
      const res = await sendTelegramMessage({
        chatId: channel.address,
        text: [
          `☕ <b>Uji Coba Notifikasi Omah Berhasil!</b>`,
          `Halo <b>${recipientName}</b>, koneksi bot Telegram untuk rumah tangga <b>${householdName}</b> berjalan lancar.`,
          ``,
          `Pengingat tagihan dan dokumen akan dikirim otomatis ke ruang obrolan ini.`,
        ].join("\n"),
      });

      if (!res.ok) {
        return { success: false, error: res.error || "Gagal mengirim ke Telegram API" };
      }
      return { success: true };
    }

    if (channel.channel === NotificationChannelType.WHATSAPP) {
      const res = await sendWahaWhatsAppMessage({
        phone: channel.address,
        text: [
          `☕ *Uji Coba Notifikasi Omah Berhasil!*`,
          `Halo *${recipientName}*, koneksi WhatsApp untuk rumah tangga *${householdName}* aktif dan siap digunakan.`,
          ``,
          `Pengingat tagihan dan dokumen akan dikirim otomatis ke nomor ini.`,
        ].join("\n"),
      });

      if (!res.ok) {
        return { success: false, error: res.error || "Gagal mengirim pesan via WAHA WhatsApp" };
      }
      return { success: true };
    }

    return { success: false, error: "Tipe kanal tidak didukung" };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat mengirim tes notifikasi",
    };
  }
}
