import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreatePaymentIntentInput,
  PaymentIntent,
  PaymentProvider,
  PaymentStatus,
  RefundInput,
  RefundResult,
  VerifyPaymentInput,
  WebhookEvent,
} from "./index.js";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
  baseUrl?: string;
}

interface RzpOrder {
  id: string;
  amount: number;
  currency: string;
}
interface RzpPayment {
  id: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  amount: number;
  amount_refunded?: number;
  method?: string;
}
interface RzpRefund {
  id: string;
  status: "pending" | "processed" | "failed";
  amount: number;
}

/** Razorpay Orders API adapter (REST, no SDK dependency). */
export class RazorpayProvider implements PaymentProvider {
  readonly name = "razorpay";
  private readonly base: string;
  constructor(private readonly cfg: RazorpayConfig) {
    this.base = cfg.baseUrl ?? "https://api.razorpay.com/v1";
  }

  private async call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const auth = Buffer.from(`${this.cfg.keyId}:${this.cfg.keySecret}`).toString("base64");
    const res = await fetch(`${this.base}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}`, ...(init.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`Razorpay ${path} failed: HTTP ${res.status} ${await res.text()}`);
    return (await res.json()) as T;
  }

  async createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
    const order = await this.call<RzpOrder>("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: input.amountMinor,
        currency: input.currency,
        receipt: input.publicPaymentId,
        notes: { ...input.notes, public_payment_id: input.publicPaymentId },
      }),
    });
    return {
      provider: this.name,
      providerOrderId: order.id,
      amountMinor: order.amount,
      currency: "INR",
      clientPayload: {
        key: this.cfg.keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        name: input.customer.name,
        email: input.customer.email,
        contact: input.customer.phone ?? "",
        description: input.description,
      },
    };
  }

  verifySignature({ providerOrderId, providerPaymentId, signature }: VerifyPaymentInput): boolean {
    const expected = createHmac("sha256", this.cfg.keySecret).update(`${providerOrderId}|${providerPaymentId}`).digest("hex");
    return safeEq(expected, signature);
  }

  async fetchStatus(providerPaymentId: string): Promise<PaymentStatus> {
    const p = await this.call<RzpPayment>(`/payments/${providerPaymentId}`);
    const map: Record<RzpPayment["status"], PaymentStatus["status"]> = {
      created: "CREATED",
      authorized: "AUTHORIZED",
      captured: "CAPTURED",
      refunded: "REFUNDED",
      failed: "FAILED",
    };
    let status = map[p.status];
    if (p.status === "captured" && (p.amount_refunded ?? 0) > 0) status = "PARTIALLY_REFUNDED";
    return { providerPaymentId: p.id, status, amountMinor: p.amount, method: p.method, raw: p };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const r = await this.call<RzpRefund>(`/payments/${input.providerPaymentId}/refund`, {
      method: "POST",
      body: JSON.stringify({
        amount: input.amountMinor,
        speed: "normal",
        receipt: input.publicRefundId,
        notes: { reason: input.reason ?? "", public_refund_id: input.publicRefundId },
      }),
    });
    const status: RefundResult["status"] = r.status === "processed" ? "PROCESSED" : r.status === "failed" ? "FAILED" : "PENDING";
    return { providerRefundId: r.id, status, amountMinor: r.amount, raw: r };
  }

  parseWebhook(rawBody: string, signature: string): WebhookEvent {
    if (!this.cfg.webhookSecret) throw new Error("Razorpay webhook secret not configured");
    const expected = createHmac("sha256", this.cfg.webhookSecret).update(rawBody).digest("hex");
    if (!safeEq(expected, signature)) throw new Error("Invalid Razorpay webhook signature");
    const json = JSON.parse(rawBody) as {
      event: string;
      payload?: { payment?: { entity?: { id: string; order_id?: string } }; refund?: { entity?: { id: string; payment_id?: string } } };
    };
    return {
      type: json.event,
      providerPaymentId: json.payload?.payment?.entity?.id ?? json.payload?.refund?.entity?.payment_id,
      providerOrderId: json.payload?.payment?.entity?.order_id,
      providerRefundId: json.payload?.refund?.entity?.id,
      raw: json,
    };
  }
}

function safeEq(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
