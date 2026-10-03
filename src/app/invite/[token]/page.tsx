import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import Link from "next/link";
import { Coffee, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { InviteAcceptForm } from "./invite-accept-form";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash },
    include: {
      household: {
        include: {
          profiles: true,
        },
      },
      createdBy: true,
    },
  });

  const now = new Date();
  let errorReason: string | null = null;
  let isAlreadyUsed = false;
  let usedByProfileName: string | null = null;

  if (!invitation) {
    errorReason = "Tautan undangan tidak ditemukan atau sudah tidak valid.";
  } else if (invitation.usedAt) {
    isAlreadyUsed = true;
    const usedProfile = invitation.usedById
      ? await prisma.profile.findUnique({ where: { id: invitation.usedById } })
      : null;
    usedByProfileName = usedProfile?.displayName || "Anggota Keluarga";
  } else if (now > invitation.expiresAt) {
    errorReason = "Tautan undangan ini telah melewati batas masa berlaku (kedaluwarsa).";
  } else if (invitation.household.profiles.length >= 2) {
    errorReason = "Rumah tangga ini sudah memiliki 2 anggota (batas maksimal tercapai).";
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-house-green text-white shadow-md mb-2">
            <Coffee className="h-6 w-6" />
          </div>
          <span className="block font-caption-mono text-xs text-starbucks-green font-bold tracking-widest uppercase">
            OMAH SYSTEM
          </span>
          <h1 className="font-serif text-2xl text-house-green font-bold">
            Undangan Rumah Tangga
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-[12px] bg-white p-6 sm:p-8 border border-border-card shadow-starbucks-card">
          {isAlreadyUsed ? (
            <div className="text-center space-y-4 py-2 animate-in fade-in duration-300">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-light text-starbucks-green">
                <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-caption-mono text-[10px] text-starbucks-green font-bold uppercase tracking-wider">
                  SUDAH TERHUBUNG
                </span>
                <h3 className="text-base font-bold text-house-green mt-1">
                  Undangan Berhasil Digunakan
                </h3>
                <p className="text-xs text-text-black-soft mt-1.5 leading-relaxed">
                  Tautan ini telah digunakan oleh <b>{usedByProfileName}</b> untuk bergabung dengan rumah tangga <b>{invitation!.household.name}</b>.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/"
                  className="btn-pill inline-flex items-center justify-center w-full bg-starbucks-green hover:bg-green-accent text-white px-5 py-2.5 text-xs font-semibold shadow-sm transition-all"
                >
                  Buka Dashboard Rumah Tangga
                </Link>
              </div>
            </div>
          ) : errorReason ? (
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-black">
                  Undangan Tidak Dapat Digunakan
                </h3>
                <p className="text-xs text-text-black-soft mt-1.5 leading-relaxed">
                  {errorReason}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/"
                  className="btn-pill inline-flex items-center justify-center w-full bg-starbucks-green hover:bg-green-accent text-white px-5 py-2.5 text-xs font-semibold shadow-sm transition-all"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          ) : (
            <InviteAcceptForm
              rawToken={token}
              householdName={invitation!.household.name}
              inviterName={invitation!.createdBy.displayName}
            />
          )}
        </div>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-1.5 text-text-black-soft text-[11px] mt-6">
          <Shield className="h-3.5 w-3.5 text-starbucks-green" />
          <span>Sistem privat aman & terenkripsi untuk 2 anggota keluarga</span>
        </div>
      </div>
    </div>
  );
}
