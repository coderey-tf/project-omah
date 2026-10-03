"use server";

import { MarkBillPaidSchema } from "@/types/schemas";
import { markBillAsPaid, unmarkBillAsPaid } from "@/lib/data/bills";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { revalidatePath } from "next/cache";

export async function markBillPaidAction(input: unknown) {
  try {
    const parsed = MarkBillPaidSchema.parse(input);
    const household = await getOrCreateDefaultHousehold();

    const result = await markBillAsPaid(parsed.billId, household.id, {
      createTransaction: parsed.createTransaction,
      walletId: parsed.walletId || undefined,
    });

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/transactions");

    return {
      success: true,
      message: result.transaction
        ? "Tagihan ditandai lunas dan transaksi pengeluaran berhasil dicatat!"
        : "Tagihan ditandai lunas!",
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menandai tagihan sebagai lunas",
    };
  }
}

export async function unmarkBillPaidAction(billId: string) {
  try {
    const household = await getOrCreateDefaultHousehold();
    const result = await unmarkBillAsPaid(billId, household.id);

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/transactions");

    return {
      success: true,
      message: "Status lunas berhasil dibatalkan",
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal membatalkan status lunas",
    };
  }
}
