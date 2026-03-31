import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

async function getSmtpConfig() {
  try {
    const settings = await prisma.smtpSettings.findFirst()
    if (settings?.host) {
      return { host: settings.host, port: settings.port, user: settings.user, pass: settings.pass, from: settings.from }
    }
  } catch {}
  return {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? '',
  }
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const cfg = await getSmtpConfig()
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  })
  await transporter.sendMail({ from: cfg.from, to, subject, html })
}

export function welcomeEmailTemplate(name: string, programName: string, stampsRequired: number): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bienvenue</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#111827;padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">🎉</div>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Bienvenue, ${name} !</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Vous venez de rejoindre notre <strong>${programName}</strong>. Commencez à cumuler vos tampons dès maintenant !</p>
      <div style="background:#f3f4f6;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Tampons nécessaires pour votre récompense</p>
        <p style="margin:0;font-size:40px;font-weight:800;color:#111827;">${stampsRequired}</p>
      </div>
      <a href="${process.env.NEXTAUTH_URL}/carte" style="display:block;background:#111827;color:#fff;text-decoration:none;text-align:center;padding:16px;border-radius:10px;font-weight:600;font-size:16px;">Voir ma carte de fidélité →</a>
    </div>
    <div style="padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Fidélité · ${process.env.NEXTAUTH_URL}</p>
    </div>
  </div>
</body>
</html>`
}

export function stampEmailTemplate(name: string, stampsNow: number, stampsRequired: number): string {
  const remaining = stampsRequired - stampsNow
  const progress = Math.round((stampsNow / stampsRequired) * 100)
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tampon reçu</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#111827;padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">✅</div>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Tampon reçu !</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Bravo ${name}, vous avez reçu un nouveau tampon !</p>
      <div style="display:flex;gap:12px;margin:24px 0;">
        <div style="flex:1;background:#f3f4f6;border-radius:12px;padding:20px;text-align:center;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">Vos tampons</p>
          <p style="margin:0;font-size:36px;font-weight:800;color:#111827;">${stampsNow}/${stampsRequired}</p>
        </div>
        <div style="flex:1;background:#f0fdf4;border-radius:12px;padding:20px;text-align:center;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">Encore</p>
          <p style="margin:0;font-size:36px;font-weight:800;color:#16a34a;">${remaining}</p>
        </div>
      </div>
      <div style="background:#f3f4f6;border-radius:8px;height:12px;margin:16px 0;">
        <div style="background:#111827;height:12px;border-radius:8px;width:${progress}%;"></div>
      </div>
      <a href="${process.env.NEXTAUTH_URL}/carte" style="display:block;background:#111827;color:#fff;text-decoration:none;text-align:center;padding:16px;border-radius:10px;font-weight:600;font-size:16px;margin-top:24px;">Voir ma carte →</a>
    </div>
  </div>
</body>
</html>`
}

export function otpEmailTemplate(name: string, otp: string, validityMinutes: number): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Code de réinitialisation</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#111827;padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">🔐</div>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Réinitialisation du mot de passe</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Bonjour ${name},<br><br>Utilisez le code ci-dessous pour réinitialiser votre mot de passe.</p>
      <div style="background:#f3f4f6;border-radius:16px;padding:28px;text-align:center;margin:24px 0;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Votre code OTP</p>
        <p style="margin:0;font-size:48px;font-weight:900;color:#111827;letter-spacing:12px;">${otp}</p>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">Ce code expire dans <strong>${validityMinutes} minutes</strong>.<br>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    </div>
  </div>
</body>
</html>`
}

export function verifyEmailTemplate(name: string, verifyUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vérifiez votre email</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#111827;padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">✉️</div>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Vérifiez votre email</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Bonjour ${name},<br><br>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et activer votre compte.</p>
      <a href="${verifyUrl}" style="display:block;background:#111827;color:#fff;text-decoration:none;text-align:center;padding:16px;border-radius:10px;font-weight:600;font-size:16px;">Vérifier mon email →</a>
      <p style="color:#9ca3af;font-size:12px;margin:20px 0 0;text-align:center;">Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.</p>
    </div>
  </div>
</body>
</html>`
}

export function inactivityEmailTemplate(
  name: string,
  stamps: number,
  stampsRequired: number,
  programName: string,
  appUrl: string,
): string {
  const remaining = stampsRequired - stamps
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>On pense à vous !</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#111827;padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">👋</div>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Ça fait longtemps, ${name} !</h1>
      <p style="color:#9ca3af;margin:8px 0 0;font-size:15px;">Vous nous manquez chez ${programName}</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Cela fait un moment que vous n'êtes pas passé. Votre carte de fidélité vous attend !</p>
      <div style="display:flex;gap:12px;margin:24px 0;">
        <div style="flex:1;background:#f3f4f6;border-radius:12px;padding:20px;text-align:center;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">Vos tampons</p>
          <p style="margin:0;font-size:36px;font-weight:800;color:#111827;">${stamps}/${stampsRequired}</p>
        </div>
        <div style="flex:1;background:#fff7ed;border-radius:12px;padding:20px;text-align:center;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">Plus que</p>
          <p style="margin:0;font-size:36px;font-weight:800;color:#ea580c;">${remaining}</p>
        </div>
      </div>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">Il ne vous reste que <strong>${remaining} tampon${remaining > 1 ? 's' : ''}</strong> pour obtenir votre récompense. Revenez nous voir !</p>
      <a href="${appUrl}/carte" style="display:block;background:#111827;color:#fff;text-decoration:none;text-align:center;padding:16px;border-radius:10px;font-weight:600;font-size:16px;">Voir ma carte →</a>
    </div>
    <div style="padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">${programName} · ${appUrl}</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Renders a custom email template by replacing {{variable}} placeholders.
 * Supported variables: {{name}}, {{stamps}}, {{stampsRequired}}, {{remaining}},
 *                      {{rewardLabel}}, {{programName}}, {{appUrl}}
 */
export function renderEmailTemplate(
  body: string,
  vars: Record<string, string>,
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

export function rewardEmailTemplate(name: string, rewardLabel: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Récompense disponible</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#111827,#374151);padding:40px 32px;text-align:center;">
      <div style="font-size:64px;margin-bottom:8px;">🎁</div>
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">Félicitations ${name} !</h1>
      <p style="color:#d1d5db;margin:8px 0 0;font-size:16px;">Votre récompense est disponible</p>
    </div>
    <div style="padding:32px;">
      <div style="background:#fef9c3;border:2px solid #fde047;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#713f12;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Votre récompense</p>
        <p style="margin:0;font-size:22px;font-weight:800;color:#111827;">${rewardLabel}</p>
      </div>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Présentez cette notification ou ouvrez votre carte de fidélité pour récupérer votre récompense.</p>
      <a href="${process.env.NEXTAUTH_URL}/carte" style="display:block;background:#111827;color:#fff;text-decoration:none;text-align:center;padding:16px;border-radius:10px;font-weight:600;font-size:16px;">Récupérer ma récompense →</a>
    </div>
  </div>
</body>
</html>`
}
