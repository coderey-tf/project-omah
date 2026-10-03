import { z } from "zod";

export const TransactionTypeSchema = z.enum(["EXPENSE", "INCOME", "TRANSFER"]);
export const WalletTypeSchema = z.enum(["CASH", "BANK", "EWALLET", "OTHER"]);
export const CategoryKindSchema = z.enum(["EXPENSE", "INCOME"]);
export const BillPeriodSchema = z.enum(["MONTHLY", "YEARLY"]);

// Transaction Schema with discriminator constraint matching constraints.sql
export const CreateTransactionSchema = z
  .object({
    type: TransactionTypeSchema,
    amount: z.number().int().positive("Nominal harus lebih dari 0"),
    walletId: z.string().uuid("Dompet asal tidak valid"),
    toWalletId: z.string().uuid("Dompet tujuan tidak valid").optional().nullable(),
    categoryId: z.string().uuid("Kategori tidak valid").optional().nullable(),
    description: z.string().max(255).optional().default(""),
    occurredOn: z.string().or(z.date()).default(() => new Date()),
  })
  .refine(
    (data) => {
      if (data.type === "TRANSFER") {
        return (
          data.toWalletId !== undefined &&
          data.toWalletId !== null &&
          data.toWalletId !== data.walletId &&
          !data.categoryId
        );
      }
      return !data.toWalletId && data.categoryId !== undefined && data.categoryId !== null;
    },
    {
      message:
        "Untuk Transfer wajib menentukan dompet tujuan dan tanpa kategori. Untuk Pemasukan/Pengeluaran wajib menentukan kategori tanpa dompet tujuan.",
      path: ["type"],
    }
  );

export const CreateWalletSchema = z.object({
  name: z.string().min(1, "Nama dompet wajib diisi").max(50),
  type: WalletTypeSchema,
  initialBalance: z.number().int().min(0).default(0),
});

export const CreateBudgetSchema = z.object({
  categoryId: z.string().uuid("Kategori tidak valid"),
  limitAmount: z.number().int().min(0, "Limit anggaran tidak boleh negatif"),
});

export const CreateBillSchema = z.object({
  name: z.string().min(1, "Nama tagihan wajib diisi").max(100),
  amount: z.number().int().positive("Nominal harus positif"),
  dueDay: z.number().int().min(1).max(31, "Hari jatuh tempo antara 1-31"),
  dueMonth: z.number().int().min(1).max(12).optional().nullable(),
  period: BillPeriodSchema.default("MONTHLY"),
  reminderDays: z.array(z.number().int()).default([3, 0]),
  categoryId: z.string().uuid().optional().nullable(),
  walletId: z.string().uuid().optional().nullable(),
});

export const MarkBillPaidSchema = z.object({
  billId: z.string().uuid("ID tagihan tidak valid"),
  createTransaction: z.boolean().default(false),
  walletId: z.string().uuid("Dompet tidak valid").optional().nullable(),
});


export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Judul tugas wajib diisi").max(200),
  assignedToId: z.string().uuid().optional().nullable(),
  dueDate: z.string().or(z.date()).optional().nullable(),
  recurrence: z.string().optional().nullable(),
});

export const CreateShoppingItemSchema = z.object({
  name: z.string().min(1, "Nama barang wajib diisi").max(100),
  quantity: z.string().max(50).optional().default("1"),
  listId: z.string().uuid("Daftar belanja tidak valid"),
});

export const CreateSavingsGoalSchema = z.object({
  name: z.string().min(1, "Nama target tabungan wajib diisi").max(100),
  targetAmount: z.number().int().positive("Nominal target harus lebih dari 0"),
  savedAmount: z.number().int().min(0, "Nominal terkumpul tidak boleh negatif").default(0),
  deadline: z.string().or(z.date()).optional().nullable(),
});

export const UpdateSavingsAmountSchema = z.object({
  goalId: z.string().uuid("ID target tidak valid"),
  savedAmount: z.number().int().min(0, "Nominal tabungan tidak boleh negatif"),
});

export const RecurrenceSchema = z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

export const CreateReminderSchema = z.object({
  title: z.string().min(1, "Judul pengingat wajib diisi").max(200),
  dueDate: z.string().or(z.date()),
  recurrence: RecurrenceSchema.default("NONE"),
  remindDaysBefore: z.array(z.number().int()).default([30, 7, 0]),
  note: z.string().max(500).optional().nullable(),
});

export const UpdateReminderSchema = z.object({
  id: z.string().uuid("ID pengingat tidak valid"),
  title: z.string().min(1, "Judul pengingat wajib diisi").max(200),
  dueDate: z.string().or(z.date()),
  recurrence: RecurrenceSchema.default("NONE"),
  remindDaysBefore: z.array(z.number().int()).default([30, 7, 0]),
  note: z.string().max(500).optional().nullable(),
});


