export interface MailAddress {
  email: string;
  name?: string;
}

export interface MailMessage {
  to: MailAddress | MailAddress[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: MailAddress;
  tags?: Record<string, string>;
}

export interface MailResult {
  ok: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

export interface MailProvider {
  readonly name: string;
  send(message: MailMessage): Promise<MailResult>;
}

/** Development fallback: prints the mail to stdout. */
export class ConsoleMailProvider implements MailProvider {
  readonly name = "console";
  async send(message: MailMessage): Promise<MailResult> {
    const to = Array.isArray(message.to) ? message.to : [message.to];
    console.log(`\n[mail:console] To: ${to.map((t) => t.email).join(", ")}\nSubject: ${message.subject}\n${message.text ?? message.html}\n`);
    return { ok: true, provider: this.name, messageId: `console-${Date.now()}` };
  }
}

export interface ZeptoMailConfig {
  apiKey: string; // "Zoho-enczapikey ..." token value
  fromEmail: string;
  fromName?: string;
  baseUrl?: string; // default https://api.zeptomail.in/v1.1
}

/** ZeptoMail transactional email (https://www.zoho.com/zeptomail/help/api/email-sending.html). */
export class ZeptoMailProvider implements MailProvider {
  readonly name = "zeptomail";
  constructor(private readonly cfg: ZeptoMailConfig) {}

  async send(message: MailMessage): Promise<MailResult> {
    const to = Array.isArray(message.to) ? message.to : [message.to];
    const body = {
      from: { address: this.cfg.fromEmail, name: this.cfg.fromName },
      to: to.map((t) => ({ email_address: { address: t.email, name: t.name } })),
      subject: message.subject,
      htmlbody: message.html,
      textbody: message.text,
      reply_to: message.replyTo ? [{ address: message.replyTo.email, name: message.replyTo.name }] : undefined,
    };
    const res = await fetch(`${this.cfg.baseUrl ?? "https://api.zeptomail.in/v1.1"}/email`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: this.cfg.apiKey.startsWith("Zoho-enczapikey") ? this.cfg.apiKey : `Zoho-enczapikey ${this.cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, provider: this.name, error: `HTTP ${res.status}: ${text.slice(0, 500)}` };
    }
    const json = (await res.json().catch(() => ({}))) as { request_id?: string };
    return { ok: true, provider: this.name, messageId: json.request_id };
  }
}

/** Resolve the mail provider from env (Phase 0). Later phases resolve from IntegrationCredential. */
export function mailProviderFromEnv(): MailProvider {
  const apiKey = process.env.ZEPTOMAIL_API_KEY;
  const fromEmail = process.env.ZEPTOMAIL_FROM_EMAIL;
  if (apiKey && fromEmail) {
    return new ZeptoMailProvider({ apiKey, fromEmail, fromName: process.env.ZEPTOMAIL_FROM_NAME });
  }
  return new ConsoleMailProvider();
}
