import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendTelegramMessage,
  formatBillTelegramMessage,
  formatBudgetTelegramMessage,
  formatReminderTelegramMessage,
} from "@/lib/notifications/telegram";
import {
  sendWahaWhatsAppMessage,
  formatBillWhatsAppMessage,
  formatReminderWhatsAppMessage,
} from "@/lib/notifications/waha";
import { formatRupiah } from "@/lib/utils";
import {
  NotificationChannelType,
  NotificationEntity,
  NotificationStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. Authorization check via CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const secretQuery = request.nextUrl.searchParams.get("secret");
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && expectedSecret !== "random-secret") {
      const token = authHeader?.replace("Bearer ", "") || secretQuery;
      if (token !== expectedSecret) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const now = new Date();
    const currentDay = now.getDate();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 2. Supabase Free Tier Keepalive
    await prisma.$queryRaw`SELECT 1`;

    let billsChecked = 0;
    let notificationsDispatched = 0;
    let budgetWarningsChecked = 0;
    let remindersChecked = 0;

    // 3. Process Households
    const households = await prisma.household.findMany({
      include: {
        profiles: {
          include: {
            channels: {
              where: { isActive: true },
            },
          },
        },
        recurringBills: {
          where: { deletedAt: null },
        },
        reminders: {
          where: { deletedAt: null, doneAt: null },
        },
        budgets: {
          include: { category: true },
        },
      },
    });

    for (const household of households) {
      // 3.1 Recurring Bills Checking
      for (const bill of household.recurringBills) {
        billsChecked++;
        let daysRemaining = bill.dueDay - currentDay;
        if (daysRemaining < 0) daysRemaining += 30; // next month wrap

        // Check if today matches any remindDaysBefore (e.g. 3 days before or 0 days before)
        if (bill.remindDaysBefore.includes(daysRemaining)) {
          const dueDateForMonth = new Date(
            now.getFullYear(),
            now.getMonth() + (bill.dueDay < currentDay ? 1 : 0),
            bill.dueDay
          );

          // Skip if already marked as paid for this cycle
          if (bill.lastPaidDueDate) {
            const lastPaid = new Date(bill.lastPaidDueDate);
            if (
              lastPaid.getFullYear() === dueDateForMonth.getFullYear() &&
              lastPaid.getMonth() === dueDateForMonth.getMonth()
            ) {
              continue;
            }
          }

          for (const profile of household.profiles) {
            const telegramChannel = profile.channels.find(
              (c) => c.channel === NotificationChannelType.TELEGRAM && c.address
            );

            // Idempotency check via NotificationLog
            const existingLog = await prisma.notificationLog.findUnique({
              where: {
                profileId_channel_entityType_entityId_dueDate_slot: {
                  profileId: profile.id,
                  channel: NotificationChannelType.TELEGRAM,
                  entityType: NotificationEntity.BILL,
                  entityId: bill.id,
                  dueDate: dueDateForMonth,
                  slot: daysRemaining,
                },
              },
            });

            if (existingLog && existingLog.status === NotificationStatus.SENT) {
              continue; // Already successfully delivered for this due cycle and slot
            }

            const messageText = formatBillTelegramMessage({
              householdName: household.name,
              billName: bill.name,
              amountFormatted: formatRupiah(Number(bill.amount)),
              dueDateFormatted: dueDateForMonth.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              daysRemaining,
            });

            let sendResult: { ok: boolean; error?: string } = {
              ok: false,
              error: "Kanal belum ditautkan",
            };
            if (telegramChannel?.address) {
              sendResult = await sendTelegramMessage({
                chatId: telegramChannel.address,
                text: messageText,
              });
            }

            await prisma.notificationLog.upsert({
              where: {
                profileId_channel_entityType_entityId_dueDate_slot: {
                  profileId: profile.id,
                  channel: NotificationChannelType.TELEGRAM,
                  entityType: NotificationEntity.BILL,
                  entityId: bill.id,
                  dueDate: dueDateForMonth,
                  slot: daysRemaining,
                },
              },
              create: {
                householdId: household.id,
                profileId: profile.id,
                channel: NotificationChannelType.TELEGRAM,
                entityType: NotificationEntity.BILL,
                entityId: bill.id,
                dueDate: dueDateForMonth,
                slot: daysRemaining,
                status: sendResult.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
                attempts: 1,
                lastError: sendResult.error || null,
                sentAt: sendResult.ok ? new Date() : null,
              },
              update: {
                status: sendResult.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
                attempts: { increment: 1 },
                lastError: sendResult.error || null,
                sentAt: sendResult.ok ? new Date() : null,
              },
            });

            if (sendResult.ok) notificationsDispatched++;

            // 3.1.2 WhatsApp (WAHA) Bill Dispatch
            const whatsappChannel = profile.channels.find(
              (c) => c.channel === NotificationChannelType.WHATSAPP && c.address
            );

            if (whatsappChannel?.address) {
              const existingWaLog = await prisma.notificationLog.findUnique({
                where: {
                  profileId_channel_entityType_entityId_dueDate_slot: {
                    profileId: profile.id,
                    channel: NotificationChannelType.WHATSAPP,
                    entityType: NotificationEntity.BILL,
                    entityId: bill.id,
                    dueDate: dueDateForMonth,
                    slot: daysRemaining,
                  },
                },
              });

              if (!existingWaLog || existingWaLog.status !== NotificationStatus.SENT) {
                const waMessage = formatBillWhatsAppMessage({
                  householdName: household.name,
                  billName: bill.name,
                  amountFormatted: formatRupiah(Number(bill.amount)),
                  dueDateFormatted: dueDateForMonth.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }),
                  daysRemaining,
                });

                let waSendResult: { ok: boolean; error?: string } = { ok: false, error: "" };
                try {
                  waSendResult = await sendWahaWhatsAppMessage({
                    phone: whatsappChannel.address,
                    text: waMessage,
                  });
                } catch (e: any) {
                  waSendResult = { ok: false, error: e.message };
                }

                await prisma.notificationLog.upsert({
                  where: {
                    profileId_channel_entityType_entityId_dueDate_slot: {
                      profileId: profile.id,
                      channel: NotificationChannelType.WHATSAPP,
                      entityType: NotificationEntity.BILL,
                      entityId: bill.id,
                      dueDate: dueDateForMonth,
                      slot: daysRemaining,
                    },
                  },
                  create: {
                    householdId: household.id,
                    profileId: profile.id,
                    channel: NotificationChannelType.WHATSAPP,
                    entityType: NotificationEntity.BILL,
                    entityId: bill.id,
                    dueDate: dueDateForMonth,
                    slot: daysRemaining,
                    status: waSendResult.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
                    attempts: 1,
                    lastError: waSendResult.error || null,
                    sentAt: waSendResult.ok ? new Date() : null,
                  },
                  update: {
                    status: waSendResult.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
                    attempts: { increment: 1 },
                    lastError: waSendResult.error || null,
                    sentAt: waSendResult.ok ? new Date() : null,
                  },
                });

                if (waSendResult.ok) notificationsDispatched++;
              }
            }
          }
        }
      }

      // 3.2 Budget Warnings Checking
      if (household.budgets.length > 0) {
        for (const budget of household.budgets) {
          budgetWarningsChecked++;
          const limit = Number(budget.limitAmount);
          if (limit <= 0) continue;

          // Calculate current month's spent for this category
          const categoryTxs = await prisma.transaction.aggregate({
            where: {
              householdId: household.id,
              categoryId: budget.categoryId,
              type: "EXPENSE",
              occurredOn: { gte: startOfMonth },
              deletedAt: null,
            },
            _sum: { amount: true },
          });

          const spent = Number(categoryTxs._sum.amount || 0);
          const ratio = spent / limit;
          let slotThreshold = 0;

          if (ratio >= 1.0) {
            slotThreshold = 100;
          } else if (ratio >= 0.8) {
            slotThreshold = 80;
          }

          if (slotThreshold > 0) {
            for (const profile of household.profiles) {
              const telegramChannel = profile.channels.find(
                (c) => c.channel === NotificationChannelType.TELEGRAM && c.address
              );

              const existingLog = await prisma.notificationLog.findUnique({
                where: {
                  profileId_channel_entityType_entityId_dueDate_slot: {
                    profileId: profile.id,
                    channel: NotificationChannelType.TELEGRAM,
                    entityType: NotificationEntity.BUDGET,
                    entityId: budget.id,
                    dueDate: startOfMonth,
                    slot: slotThreshold,
                  },
                },
              });

              if (existingLog && existingLog.status === NotificationStatus.SENT) {
                continue;
              }

              const budgetMsg = formatBudgetTelegramMessage({
                householdName: household.name,
                categoryName: budget.category.name,
                percentage: Math.round(ratio * 100),
                spentFormatted: formatRupiah(spent),
                limitFormatted: formatRupiah(limit),
              });

              let sendResult: { ok: boolean; error?: string } = {
                ok: false,
                error: "Kanal belum ditautkan",
              };
              if (telegramChannel?.address) {
                sendResult = await sendTelegramMessage({
                  chatId: telegramChannel.address,
                  text: budgetMsg,
                });
              }

              await prisma.notificationLog.upsert({
                where: {
                  profileId_channel_entityType_entityId_dueDate_slot: {
                    profileId: profile.id,
                    channel: NotificationChannelType.TELEGRAM,
                    entityType: NotificationEntity.BUDGET,
                    entityId: budget.id,
                    dueDate: startOfMonth,
                    slot: slotThreshold,
                  },
                },
                create: {
                  householdId: household.id,
                  profileId: profile.id,
                  channel: NotificationChannelType.TELEGRAM,
                  entityType: NotificationEntity.BUDGET,
                  entityId: budget.id,
                  dueDate: startOfMonth,
                  slot: slotThreshold,
                  status: sendResult.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
                  attempts: 1,
                  lastError: sendResult.error || null,
                  sentAt: sendResult.ok ? new Date() : null,
                },
                update: {
                  status: sendResult.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
                  attempts: { increment: 1 },
                  lastError: sendResult.error || null,
                  sentAt: sendResult.ok ? new Date() : null,
                },
              });

              if (sendResult.ok) notificationsDispatched++;
            }
          }
        }
      }

      // 3.3 Reminders Checking (Documents, STNK, Tax, etc.)
      for (const reminder of household.reminders) {
        remindersChecked++;
        const dueDate = new Date(reminder.dueDate);
        const dueTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
        const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const daysRemaining = Math.round((dueTime - todayTime) / (1000 * 60 * 60 * 24));

        if (reminder.remindDaysBefore.includes(daysRemaining)) {
          for (const profile of household.profiles) {
            const telegramChannel = profile.channels.find(
              (c) => c.channel === NotificationChannelType.TELEGRAM && c.address
            );

            // Idempotency check via NotificationLog
            const existingLog = await prisma.notificationLog.findUnique({
              where: {
                profileId_channel_entityType_entityId_dueDate_slot: {
                  profileId: profile.id,
                  channel: NotificationChannelType.TELEGRAM,
                  entityType: NotificationEntity.REMINDER,
                  entityId: reminder.id,
                  dueDate: reminder.dueDate,
                  slot: daysRemaining,
                },
              },
            });

            if (existingLog && existingLog.status === NotificationStatus.SENT) {
              continue;
            }

            const messageText = formatReminderTelegramMessage({
              householdName: household.name,
              title: reminder.title,
              dueDateFormatted: dueDate.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              daysRemaining,
              note: reminder.note,
            });

            let sendResult: { ok: boolean; error?: string } = {
              ok: false,
              error: "Kanal belum ditautkan",
            };
            if (telegramChannel?.address) {
              sendResult = await sendTelegramMessage({
                chatId: telegramChannel.address,
                text: messageText,
              });
            }

            await prisma.notificationLog.upsert({
              where: {
                profileId_channel_entityType_entityId_dueDate_slot: {
                  profileId: profile.id,
                  channel: NotificationChannelType.TELEGRAM,
                  entityType: NotificationEntity.REMINDER,
                  entityId: reminder.id,
                  dueDate: reminder.dueDate,
                  slot: daysRemaining,
                },
              },
              create: {
                householdId: household.id,
                profileId: profile.id,
                channel: NotificationChannelType.TELEGRAM,
                entityType: NotificationEntity.REMINDER,
                entityId: reminder.id,
                dueDate: reminder.dueDate,
                slot: daysRemaining,
                status: sendResult.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
                attempts: 1,
                lastError: sendResult.error || null,
                sentAt: sendResult.ok ? new Date() : null,
              },
              update: {
                status: sendResult.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
                attempts: { increment: 1 },
                lastError: sendResult.error || null,
                sentAt: sendResult.ok ? new Date() : null,
              },
            });

            if (sendResult.ok) notificationsDispatched++;

            // 3.3.2 WhatsApp (WAHA) Reminder Dispatch
            const whatsappChannel = profile.channels.find(
              (c) => c.channel === NotificationChannelType.WHATSAPP && c.address
            );

            if (whatsappChannel?.address) {
              const existingWaLog = await prisma.notificationLog.findUnique({
                where: {
                  profileId_channel_entityType_entityId_dueDate_slot: {
                    profileId: profile.id,
                    channel: NotificationChannelType.WHATSAPP,
                    entityType: NotificationEntity.REMINDER,
                    entityId: reminder.id,
                    dueDate: reminder.dueDate,
                    slot: daysRemaining,
                  },
                },
              });

              if (!existingWaLog || existingWaLog.status !== NotificationStatus.SENT) {
                const waMessage = formatReminderWhatsAppMessage({
                  householdName: household.name,
                  title: reminder.title,
                  dueDateFormatted: dueDate.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }),
                  daysRemaining,
                  note: reminder.note,
                });

                let waSendResult: { ok: boolean; error?: string } = { ok: false, error: "" };
                try {
                  waSendResult = await sendWahaWhatsAppMessage({
                    phone: whatsappChannel.address,
                    text: waMessage,
                  });
                } catch (e: any) {
                  waSendResult = { ok: false, error: e.message };
                }

                await prisma.notificationLog.upsert({
                  where: {
                    profileId_channel_entityType_entityId_dueDate_slot: {
                      profileId: profile.id,
                      channel: NotificationChannelType.WHATSAPP,
                      entityType: NotificationEntity.REMINDER,
                      entityId: reminder.id,
                      dueDate: reminder.dueDate,
                      slot: daysRemaining,
                    },
                  },
                  create: {
                    householdId: household.id,
                    profileId: profile.id,
                    channel: NotificationChannelType.WHATSAPP,
                    entityType: NotificationEntity.REMINDER,
                    entityId: reminder.id,
                    dueDate: reminder.dueDate,
                    slot: daysRemaining,
                    status: waSendResult.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
                    attempts: 1,
                    lastError: waSendResult.error || null,
                    sentAt: waSendResult.ok ? new Date() : null,
                  },
                  update: {
                    status: waSendResult.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
                    attempts: { increment: 1 },
                    lastError: waSendResult.error || null,
                    sentAt: waSendResult.ok ? new Date() : null,
                  },
                });

                if (waSendResult.ok) notificationsDispatched++;
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      keepalive: "ok",
      stats: {
        households: households.length,
        billsChecked,
        budgetWarningsChecked,
        remindersChecked,
        notificationsDispatched,
      },
    });
  } catch (err: any) {
    console.error("[Daily Cron Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
