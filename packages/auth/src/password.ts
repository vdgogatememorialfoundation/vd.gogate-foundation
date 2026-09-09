import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghjkmnpqrstuvwxyz";
const DIGIT = "23456789";
const SYMBOL = "@#$%&*!";

/** Secure temporary password: 12 chars, guaranteed one of each class, unambiguous alphabet. */
export function generateTemporaryPassword(length = 12): string {
  const all = UPPER + LOWER + DIGIT + SYMBOL;
  const chars = [
    UPPER[randomInt(UPPER.length)]!,
    LOWER[randomInt(LOWER.length)]!,
    DIGIT[randomInt(DIGIT.length)]!,
    SYMBOL[randomInt(SYMBOL.length)]!,
  ];
  while (chars.length < length) chars.push(all[randomInt(all.length)]!);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}

export const PASSWORD_MIN_LENGTH = 8;

export function passwordPolicyError(plain: string): string | null {
  if (plain.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  if (!/[A-Za-z]/.test(plain) || !/[0-9]/.test(plain)) return "Password must contain letters and numbers";
  return null;
}
