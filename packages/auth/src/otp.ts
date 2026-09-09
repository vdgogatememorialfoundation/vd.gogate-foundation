import { randomInt } from "node:crypto";
import { prisma, type OtpChannel, type OtpPurpose } from "@vgmf/db";
import { sha256 } from "@vgmf/integrations";
import { UserError } from "./users.js";

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;

export function generateOtp(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
}

function otpHash(userId: string, purpose: OtpPurpose, code: string): string {
  return sha256(`${userId}:${purpose}:${code}`);
}

export async function issueOtp(userId: string, purpose: OtpPurpose, destination: string, channel: OtpChannel = "EMAIL"): Promise<{ code: string; expiresAt: Date }> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);
  await prisma.$transaction([
    prisma.otpCode.updateMany({ where: { userId, purpose, consumedAt: null }, data: { consumedAt: new Date() } }),
    prisma.otpCode.create({ data: { userId, purpose, channel, destination, codeHash: otpHash(userId, purpose, code), expiresAt } }),
  ]);
  return { code, expiresAt };
}

export async function verifyOtp(userId: string, purpose: OtpPurpose, code: string): Promise<void> {
  const otp = await prisma.otpCode.findFirst({ where: { userId, purpose, consumedAt: null }, orderBy: { createdAt: "desc" } });
  if (!otp) throw new UserError("OTP_INVALID", "No verification code is pending. Request a new one.");
  if (otp.expiresAt < new Date()) throw new UserError("OTP_EXPIRED", "The code has expired. Request a new one.");
  if (otp.attempts >= otp.maxAttempts) throw new UserError("OTP_INVALID", "Too many attempts. Request a new code.");
  if (otp.codeHash !== otpHash(userId, purpose, code.trim())) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new UserError("OTP_INVALID", "Incorrect code");
  }
  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
}
