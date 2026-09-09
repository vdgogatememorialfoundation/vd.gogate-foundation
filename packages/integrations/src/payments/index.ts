/**
 * Payment provider interface. Every paying domain (events, competitions,
 * fellowship, shop, POS) goes through the Payment Service, which delegates to
 * the default enabled PaymentProvider (Razorpay initially).
 */

export type Currency = "INR";

export interface CreatePaymentIntentInput {
  publicPaymentId: string; // our PAY-xxxx reference, sent as receipt/reference
  amountMinor: number; // paise
  currency: Currency;
  description: string;
  customer: { name: string; email: string; phone?: string };
  notes?: Record<string, string>;
  callbackUrl?: string;
}

export interface PaymentIntent {
  provider: string;
  providerOrderId: string;
  amountMinor: number;
  currency: Currency;
  /** Data the client SDK needs (e.g. Razorpay key_id + order_id). Never includes secrets. */
  clientPayload: Record<string, string | number>;
}

export interface VerifyPaymentInput {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface PaymentStatus {
  providerPaymentId: string;
  status: "CREATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  amountMinor: number;
  method?: string;
  raw?: unknown;
}

export interface RefundInput {
  providerPaymentId: string;
  amountMinor?: number; // omit for full refund
  publicRefundId: string;
  reason?: string;
}

export interface RefundResult {
  providerRefundId: string;
  status: "PENDING" | "PROCESSED" | "FAILED";
  amountMinor: number;
  raw?: unknown;
}

export interface WebhookEvent {
  type: string;
  providerPaymentId?: string;
  providerOrderId?: string;
  providerRefundId?: string;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent>;
  verifySignature(input: VerifyPaymentInput): boolean;
  fetchStatus(providerPaymentId: string): Promise<PaymentStatus>;
  refund(input: RefundInput): Promise<RefundResult>;
  parseWebhook(rawBody: string, signature: string): WebhookEvent;
}

export * from "./razorpay.js";
