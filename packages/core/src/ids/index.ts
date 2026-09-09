import { randomInt } from "node:crypto";

/**
 * Public identifiers.
 *
 * Internal primary keys are UUIDs. Humans see 12-digit numeric public IDs
 * (users, events, applications, competitions) and prefixed alphanumeric IDs
 * (payments, orders, tickets). Public IDs are random, not sequential, so
 * volumes cannot be inferred. Callers must retry on the (rare) unique
 * violation — see `generateUniquePublicId`.
 */

export const PUBLIC_ID_LENGTH = 12;

/** 12-digit numeric string. First digit is never 0 so the length is stable in every UI. */
export function randomNumericId(length: number = PUBLIC_ID_LENGTH): string {
  if (length < 2) throw new Error("length must be >= 2");
  let out = String(randomInt(1, 10));
  while (out.length < length) {
    // Draw in chunks to reduce crypto calls.
    const chunk = randomInt(0, 1_000_000_000).toString().padStart(9, "0");
    out += chunk;
  }
  return out.slice(0, length);
}

export function isValidPublicId(value: string, length: number = PUBLIC_ID_LENGTH): boolean {
  return new RegExp(`^[1-9][0-9]{${length - 1}}$`).test(value);
}

const ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity

export function randomToken(length: number, alphabet: string = ALPHANUM): string {
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[randomInt(0, alphabet.length)];
  return out;
}

/** Prefixed public references, e.g. PAY-7K3M9XQ2AB, ORD-..., TKT-..., APP-... */
export type PublicRefPrefix = "PAY" | "ORD" | "TKT" | "INV" | "CRN" | "RCP" | "SHP" | "RET";

export function randomPublicRef(prefix: PublicRefPrefix, length = 10): string {
  return `${prefix}-${randomToken(length)}`;
}

/**
 * Generate an ID and verify uniqueness with the supplied `exists` check.
 * Retries a bounded number of times; the DB unique constraint is the final guard.
 */
export async function generateUniquePublicId(
  exists: (candidate: string) => Promise<boolean>,
  options: { length?: number; maxAttempts?: number; generator?: () => string } = {}
): Promise<string> {
  const { length = PUBLIC_ID_LENGTH, maxAttempts = 10 } = options;
  const generator = options.generator ?? (() => randomNumericId(length));
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generator();
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error(`Could not generate a unique public id after ${maxAttempts} attempts`);
}

/** Format 12-digit ids for humans: 1234 5678 9012 */
export function formatPublicId(id: string): string {
  return id.replace(/(\d{4})(?=\d)/g, "$1 ");
}
