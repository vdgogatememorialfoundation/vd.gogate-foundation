import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { RazorpayProvider } from "./razorpay.js";

describe("RazorpayProvider", () => {
  const p = new RazorpayProvider({ keyId: "rzp_test", keySecret: "secret", webhookSecret: "whsec" });
  it("verifies checkout signature", () => {
    const sig = createHmac("sha256", "secret").update("order_1|pay_1").digest("hex");
    expect(p.verifySignature({ providerOrderId: "order_1", providerPaymentId: "pay_1", signature: sig })).toBe(true);
    expect(p.verifySignature({ providerOrderId: "order_1", providerPaymentId: "pay_2", signature: sig })).toBe(false);
  });
  it("parses webhook", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_9", order_id: "order_9" } } } });
    const sig = createHmac("sha256", "whsec").update(body).digest("hex");
    expect(p.parseWebhook(body, sig)).toMatchObject({ type: "payment.captured", providerPaymentId: "pay_9", providerOrderId: "order_9" });
    expect(() => p.parseWebhook(body, "bad")).toThrow();
  });
});
