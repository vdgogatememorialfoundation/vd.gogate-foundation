import type { IntegrationCategory } from "@vgmf/db";

export type SecretField = { key: string; label: string; secret?: boolean; placeholder?: string };

export type ProviderDef = {
  provider: string;
  label: string;
  category: IntegrationCategory;
  docs?: string;
  fields: SecretField[];
  configFields?: SecretField[];
  status: "ready" | "planned";
};

/** Catalogue of integrations the admin can configure. Secrets are AES-256-GCM encrypted at rest. */
export const PROVIDERS: ProviderDef[] = [
  { provider: "razorpay", label: "Razorpay", category: "PAYMENT", status: "ready", docs: "https://razorpay.com/docs/api/", fields: [{ key: "keyId", label: "Key ID" }, { key: "keySecret", label: "Key Secret", secret: true }, { key: "webhookSecret", label: "Webhook Secret", secret: true }] },
  { provider: "zeptomail", label: "ZeptoMail", category: "EMAIL", status: "ready", docs: "https://www.zoho.com/zeptomail/help/api/", fields: [{ key: "apiKey", label: "Send Mail Token", secret: true }], configFields: [{ key: "fromEmail", label: "From email", placeholder: "noreply@vaidyagogate.org" }, { key: "fromName", label: "From name" }] },
  { provider: "shiprocket", label: "Shiprocket", category: "SHIPPING", status: "planned", fields: [{ key: "email", label: "API user email" }, { key: "password", label: "API user password", secret: true }] },
  { provider: "ithink", label: "iThink Logistics", category: "SHIPPING", status: "planned", fields: [{ key: "accessToken", label: "Access token", secret: true }, { key: "secretKey", label: "Secret key", secret: true }] },
  { provider: "porter", label: "Porter", category: "HYPERLOCAL", status: "planned", fields: [{ key: "apiKey", label: "API key", secret: true }] },
  { provider: "shadowfax", label: "Shadowfax", category: "HYPERLOCAL", status: "planned", fields: [{ key: "apiKey", label: "API key", secret: true }] },
  { provider: "tookan", label: "Tookan", category: "HYPERLOCAL", status: "planned", fields: [{ key: "apiKey", label: "API key", secret: true }] },
  { provider: "shipday", label: "Shipday", category: "HYPERLOCAL", status: "planned", fields: [{ key: "apiKey", label: "API key", secret: true }] },
  { provider: "google_maps", label: "Google Maps", category: "MAPS", status: "planned", fields: [{ key: "apiKey", label: "Browser API key", secret: true }] },
  { provider: "msg91", label: "SMS (MSG91)", category: "SMS", status: "planned", fields: [{ key: "authKey", label: "Auth key", secret: true }], configFields: [{ key: "senderId", label: "Sender ID" }] },
  { provider: "whatsapp_cloud", label: "WhatsApp Cloud API", category: "WHATSAPP", status: "planned", fields: [{ key: "accessToken", label: "Access token", secret: true }], configFields: [{ key: "phoneNumberId", label: "Phone number ID" }] },
  { provider: "cloudflare_r2", label: "Cloudflare R2", category: "STORAGE", status: "planned", fields: [{ key: "accessKeyId", label: "Access key ID" }, { key: "secretAccessKey", label: "Secret access key", secret: true }], configFields: [{ key: "accountId", label: "Account ID" }, { key: "bucket", label: "Bucket" }, { key: "publicUrl", label: "Public URL" }] },
  { provider: "openai", label: "AI chat (OpenAI-compatible)", category: "AI", status: "planned", fields: [{ key: "apiKey", label: "API key", secret: true }], configFields: [{ key: "model", label: "Model" }] },
];

export function providerDef(provider: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.provider === provider);
}

/** Branding / site settings editable from the admin. */
export const SITE_SETTINGS: { key: string; label: string; type: "text" | "url" | "color" | "textarea"; help?: string }[] = [
  { key: "branding.site_name", label: "Site name", type: "text" },
  { key: "branding.logo_url", label: "Website logo URL", type: "url" },
  { key: "branding.app_logo_url", label: "Mobile app logo URL", type: "url" },
  { key: "branding.primary_color", label: "Primary colour", type: "color" },
  { key: "contact.email", label: "Contact email", type: "text" },
  { key: "contact.phone", label: "Contact phone", type: "text" },
  { key: "contact.address", label: "Address", type: "textarea" },
  { key: "contact.whatsapp", label: "WhatsApp number", type: "text" },
  { key: "seo.default_title", label: "Default SEO title", type: "text" },
  { key: "seo.default_description", label: "Default SEO description", type: "textarea" },
  { key: "seo.google_site_verification", label: "Google site verification", type: "text" },
];
