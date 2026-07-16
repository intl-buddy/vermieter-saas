/** Absenderadresse für System-Mails. */
export const SENDER_EMAIL = "noreply@tefter.de";
export const SENDER_NAME = "tefter";

export interface BrevoAttachment {
  content: string; // Base64
  name: string;
}

export interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: BrevoAttachment[];
}

export type SendEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Versendet eine E-Mail über die Brevo-API (gleiches Muster wie der
 * Mahnversand). Wirft nicht, sondern gibt ein Ergebnisobjekt zurück.
 */
export async function sendBrevoEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "BREVO_API_KEY fehlt." };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      replyTo: params.replyTo ? { email: params.replyTo } : undefined,
      to: [{ email: params.to, name: params.toName || params.to }],
      subject: params.subject,
      htmlContent: params.html,
      attachment: params.attachments,
    }),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      if (err?.message) detail = err.message;
    } catch {
      // ignore
    }
    return { ok: false, error: detail };
  }
  return { ok: true };
}

/**
 * tefter-Mail-Layout (Navy-Header, Gold-Trennlinie) mit variablem Inhalt.
 * `bodyHtml` wird als Fließtext-Block eingesetzt.
 */
export function tefterEmailShell(bodyHtml: string): string {
  return `<!doctype html><html lang="de"><body style="margin:0;padding:0;background-color:#f7f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f8f8;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr><td align="center" style="background-color:#1e3a8a;padding:28px 24px;"><span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">tefter</span></td></tr>
          <tr><td style="height:3px;line-height:3px;font-size:0;background-color:#c2aa63;">&nbsp;</td></tr>
          <tr><td style="padding:36px 40px;">${bodyHtml}</td></tr>
        </table>
        <p style="margin:20px 0 0 0;font-size:12px;color:#9aa2a8;">© tefter · Immobilienverwaltung, einfach gemacht</p>
      </td></tr>
    </table>
  </body></html>`;
}
