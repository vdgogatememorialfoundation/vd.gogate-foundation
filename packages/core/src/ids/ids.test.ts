import { describe, expect, it } from "vitest";
import {
  formatPublicId,
  generateUniquePublicId,
  isValidPublicId,
  randomNumericId,
  randomPublicRef,
} from "./index.js";

describe("public ids", () => {
  it("generates 12-digit numeric ids without leading zero", () => {
    for (let i = 0; i < 1000; i++) {
      const id = randomNumericId();
      expect(id).toMatch(/^[1-9][0-9]{11}$/);
      expect(isValidPublicId(id)).toBe(true);
    }
  });

  it("is not sequential", () => {
    const a = Number(randomNumericId());
    const b = Number(randomNumericId());
    expect(Math.abs(a - b)).toBeGreaterThan(1);
  });

  it("retries on collision", async () => {
    const taken = new Set<string>();
    let calls = 0;
    const id = await generateUniquePublicId(async (c) => {
      calls++;
      if (calls === 1) {
        taken.add(c);
        return true;
      }
      return taken.has(c);
    });
    expect(calls).toBe(2);
    expect(isValidPublicId(id)).toBe(true);
  });

  it("gives up after maxAttempts", async () => {
    await expect(generateUniquePublicId(async () => true, { maxAttempts: 3 })).rejects.toThrow();
  });

  it("prefixed refs", () => {
    expect(randomPublicRef("PAY")).toMatch(/^PAY-[A-HJ-NP-Z2-9]{10}$/);
  });

  it("formats", () => {
    expect(formatPublicId("123456789012")).toBe("1234 5678 9012");
  });
});
