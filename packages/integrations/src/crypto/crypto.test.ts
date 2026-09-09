import { describe, expect, it } from "vitest";
import { decryptJson, encryptJson, maskSecret } from "./index.js";

describe("crypto", () => {
  it("round trips", () => {
    const enc = encryptJson({ key_id: "rzp_test_123", key_secret: "s3cr3t" });
    expect(enc.startsWith("v1.")).toBe(true);
    expect(decryptJson(enc)).toEqual({ key_id: "rzp_test_123", key_secret: "s3cr3t" });
  });
  it("detects tampering", () => {
    const enc = encryptJson({ a: 1 });
    const parts = enc.split(".");
    parts[3] = Buffer.from("xx").toString("base64");
    expect(() => decryptJson(parts.join("."))).toThrow();
  });
  it("masks", () => {
    expect(maskSecret("rzp_test_ABCDEFGH")).toMatch(/•+EFGH$/);
  });
});
