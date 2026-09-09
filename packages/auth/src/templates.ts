import type { MailMessage } from "@vgmf/integrations";

const siteName = () => process.env.NEXT_PUBLIC_SITE_NAME ?? "Vaidya Gogate Memorial Foundation";
const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f6f7f9;padding:24px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
    <h2 style="margin:0 0 16px;color:#7c2d12">${siteName()}</h2>
    <h3 style="margin:0 0 12px">${title}</h3>
    ${body}
    <p style="color:#6b7280;font-size:12px;margin-top:32px">This is an automated message from ${siteName()}.</p>
  </div></body></html>`;
}

export function otpMail(to: { email: string; name: string }, code: string, purposeLabel: string): MailMessage {
  return {
    to,
    subject: `${code} is your ${siteName()} verification code`,
    html: layout(purposeLabel, `<p>Hello ${to.name},</p><p>Your verification code is</p><p style="font-size:28px;letter-spacing:6px;font-weight:bold">${code}</p><p>It expires in 10 minutes. Do not share it with anyone.</p>`),
    text: `Your ${siteName()} verification code is ${code}. It expires in 10 minutes.`,
  };
}

export function accountCredentialsMail(to: { email: string; name: string }, publicId: string, temporaryPassword: string): MailMessage {
  const login = `${appUrl()}/login`;
  return {
    to,
    subject: `Your ${siteName()} account details`,
    html: layout(
      "Your account is ready",
      `<p>Hello ${to.name},</p>
       <p>Your account has been created.</p>
       <table style="border-collapse:collapse">
         <tr><td style="padding:4px 12px 4px 0;color:#6b7280">User ID</td><td><b>${publicId}</b></td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Email</td><td>${to.email}</td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Temporary password</td><td><code>${temporaryPassword}</code></td></tr>
       </table>
       <p>Sign in at <a href="${login}">${login}</a>. You will be asked to set a new password on first login.</p>`
    ),
    text: `Your ${siteName()} account.\nUser ID: ${publicId}\nEmail: ${to.email}\nTemporary password: ${temporaryPassword}\nSign in: ${login}`,
  };
}

export function passwordResetByAdminMail(to: { email: string; name: string }, publicId: string, temporaryPassword: string): MailMessage {
  const login = `${appUrl()}/login`;
  return {
    to,
    subject: `${siteName()} — your password was reset`,
    html: layout("Password reset", `<p>Hello ${to.name},</p><p>A temporary password has been issued for user ID <b>${publicId}</b>:</p><p><code>${temporaryPassword}</code></p><p>Sign in at <a href="${login}">${login}</a> and set a new password.</p>`),
    text: `Temporary password for ${publicId}: ${temporaryPassword}. Sign in: ${login}`,
  };
}
