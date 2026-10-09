"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MemberRole } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { TEST_HOUSEHOLD_ID, TEST_ADMIN_ID } from "@/lib/data/households";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createInvitationAction(householdId: string) {
  try {
    // 1. Verify current member count
    const memberCount = await prisma.profile.count({
      where: { householdId },
    });

    if (memberCount >= 2) {
      return {
        success: false,
        error: "Rumah tangga sudah mencapai batas maksimal 2 anggota (Suami & Istri)",
      };
    }

    // 2. Find admin profile
    const adminProfile = await prisma.profile.findFirst({
      where: { householdId, role: MemberRole.ADMIN },
    });
    if (!adminProfile) throw new Error("Profil admin tidak ditemukan");

    // 3. Generate raw token and hash
    const rawToken = crypto.randomBytes(24).toString("hex");
    const tokenHash = hashToken(rawToken);

    // 4. Save to database
    await prisma.invitation.create({
      data: {
        householdId,
        tokenHash,
        createdById: adminProfile.id,
        expiresAt: new Date(Date.now() + 7 * 86400000), // 7 days validity
      },
    });

    revalidatePath("/settings");
    return {
      success: true,
      rawToken,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal membuat tautan undangan",
    };
  }
}

export async function acceptInvitationAction(rawToken: string, displayName: string) {
  try {
    if (!displayName.trim()) {
      return { success: false, error: "Nama panggilan wajib diisi" };
    }

    const tokenHash = hashToken(rawToken);

    // 1. Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash },
      include: { household: true },
    });

    if (!invitation) {
      return { success: false, error: "Tautan undangan tidak valid atau tidak ditemukan" };
    }

    // If invitation was already used, check if it was accepted by a profile
    if (invitation.usedAt) {
      const existingProfile = invitation.usedById
        ? await prisma.profile.findUnique({ where: { id: invitation.usedById } })
        : null;

      if (existingProfile) {
        // Automatically establish session for this partner so they can enter without error
        const cookieStore = await cookies();
        cookieStore.set(
          "omah_session",
          JSON.stringify({
            id: existingProfile.id,
            displayName: existingProfile.displayName,
            role: existingProfile.role,
            householdId: existingProfile.householdId,
            email: `${existingProfile.displayName.toLowerCase().replace(/\s+/g, "")}@omah.local`,
          }),
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
            sameSite: "lax",
          }
        );

        revalidatePath("/");
        revalidatePath("/settings");
        return {
          success: true,
          householdName: invitation.household.name,
          profileName: existingProfile.displayName,
        };
      }

      return { success: false, error: "Tautan undangan ini sudah pernah digunakan" };
    }

    if (new Date() > invitation.expiresAt) {
      return { success: false, error: "Tautan undangan telah kedaluwarsa" };
    }

    // 2. Enforce 2 members max
    const memberCount = await prisma.profile.count({
      where: { householdId: invitation.householdId },
    });

    if (memberCount >= 2) {
      return {
        success: false,
        error: "Rumah tangga sudah mencapai batas maksimal 2 anggota",
      };
    }

    // 3. Create partner profile
    const newProfile = await prisma.profile.create({
      data: {
        id: crypto.randomUUID(),
        householdId: invitation.householdId,
        displayName: displayName.trim(),
        role: MemberRole.MEMBER,
      },
    });

    // 4. Mark invitation as used
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        usedAt: new Date(),
        usedById: newProfile.id,
      },
    });

    // 5. Automatically create session cookie for the new member
    const cookieStore = await cookies();
    cookieStore.set(
      "omah_session",
      JSON.stringify({
        id: newProfile.id,
        displayName: newProfile.displayName,
        role: MemberRole.MEMBER,
        householdId: invitation.householdId,
        email: `${newProfile.displayName.toLowerCase().replace(/\s+/g, "")}@omah.local`,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
      }
    );

    revalidatePath("/");
    revalidatePath("/settings");
    return {
      success: true,
      householdName: invitation.household.name,
      profileName: newProfile.displayName,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menerima undangan",
    };
  }
}

export async function removeMemberAction(householdId: string, memberProfileId: string) {
  try {
    const member = await prisma.profile.findFirst({
      where: { id: memberProfileId, householdId },
    });

    if (!member) {
      return { success: false, error: "Anggota tidak ditemukan" };
    }

    if (member.role === MemberRole.ADMIN) {
      return { success: false, error: "Admin rumah tangga tidak dapat dikeluarkan" };
    }

    const adminProfile = await prisma.profile.findFirst({
      where: { householdId, role: MemberRole.ADMIN },
    });

    if (!adminProfile) {
      return { success: false, error: "Profil Admin tidak ditemukan" };
    }

    await prisma.$transaction(async (tx) => {
      // Reassign transactions to admin
      await tx.transaction.updateMany({
        where: { createdById: member.id },
        data: { createdById: adminProfile.id },
      });

      // Reassign uploaded documents to admin
      await tx.documentVault.updateMany({
        where: { createdById: member.id },
        data: { createdById: adminProfile.id },
      });

      // Unassign tasks
      await tx.task.updateMany({
        where: { assigneeId: member.id },
        data: { assigneeId: null },
      });

      // Unassign checked items
      await tx.shoppingItem.updateMany({
        where: { checkedById: member.id },
        data: { checkedById: null },
      });

      // Clear or delete invitations used by this member
      await tx.invitation.deleteMany({
        where: { householdId, usedById: member.id },
      });

      // Delete notification channels & logs
      await tx.notificationChannel.deleteMany({
        where: { profileId: member.id },
      });

      await tx.notificationLog.deleteMany({
        where: { profileId: member.id },
      });

      // Delete profile
      await tx.profile.delete({
        where: { id: member.id },
      });
    });

    revalidatePath("/");
    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Gagal mengeluarkan anggota:", error);
    return {
      success: false,
      error: error.message || "Gagal mengeluarkan anggota dari rumah tangga",
    };
  }
}

export async function loginWithTestingAccountAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.set(
      "omah_session",
      JSON.stringify({
        id: TEST_ADMIN_ID,
        displayName: "Admin Testing",
        role: "ADMIN",
        email: "testing@omah.local",
        householdId: TEST_HOUSEHOLD_ID,
        isTesting: true,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
      }
    );

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal masuk akun testing" };
  }
}

export async function signInAction(email: string, password: string) {
  try {
    if (!email || !password) {
      return { success: false, error: "Email dan kata sandi wajib diisi" };
    }

    const isTestAccount =
      email === "testing@omah.local" ||
      email === "admin@omah.local" ||
      email.toLowerCase().includes("test") ||
      email.toLowerCase().includes("demo") ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "placeholder-anon-key";

    if (isTestAccount) {
      const cookieStore = await cookies();
      cookieStore.set(
        "omah_session",
        JSON.stringify({
          id: TEST_ADMIN_ID,
          displayName: "Admin Testing",
          role: "ADMIN",
          email: "testing@omah.local",
          householdId: TEST_HOUSEHOLD_ID,
          isTesting: true,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
          sameSite: "lax",
        }
      );

      revalidatePath("/");
      return { success: true };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message || "Gagal masuk ke sistem" };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat masuk",
    };
  }
}

export async function signUpAction(email: string, password: string, displayName: string) {
  try {
    if (!email || !password) {
      return { success: false, error: "Email dan kata sandi wajib diisi" };
    }

    if (password.length < 6) {
      return { success: false, error: "Kata sandi minimal 6 karakter" };
    }

    const isTestAccount =
      email.toLowerCase().includes("test") ||
      email.toLowerCase().includes("demo") ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "placeholder-anon-key";

    if (isTestAccount) {
      const cookieStore = await cookies();
      cookieStore.set(
        "omah_session",
        JSON.stringify({
          id: TEST_ADMIN_ID,
          displayName: displayName.trim() || "Admin Testing",
          role: "ADMIN",
          email,
          householdId: TEST_HOUSEHOLD_ID,
          isTesting: true,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
          sameSite: "lax",
        }
      );

      revalidatePath("/");
      return { success: true, needEmailConfirmation: false };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim() || "Anggota",
        },
      },
    });

    if (error) {
      return { success: false, error: error.message || "Gagal mendaftarkan akun" };
    }

    revalidatePath("/");
    return {
      success: true,
      needEmailConfirmation: !data.session,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat mendaftar",
    };
  }
}

export async function signOutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("omah_session");
    const supabase = await createClient();
    await supabase.auth.signOut().catch(() => {});
  } catch (err) {
    console.error("Signout error:", err);
  }
  revalidatePath("/");
  redirect("/login");
}


