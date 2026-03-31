import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const { email } = schema.parse(body)

    await sendEmail({
      to: email,
      subject: 'Test de configuration SMTP',
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Test SMTP</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#111827;padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">✅</div>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Configuration SMTP OK</h1>
    </div>
    <div style="padding:32px;text-align:center;">
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 8px;">Votre configuration SMTP fonctionne correctement.</p>
      <p style="color:#9ca3af;font-size:13px;margin:0;">Les emails automatiques seront envoyés depuis cette adresse.</p>
    </div>
  </div>
</body>
</html>`,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }
    console.error('Test email error:', error)
    return NextResponse.json({ error: 'Échec de l\'envoi. Vérifiez votre configuration SMTP.' }, { status: 500 })
  }
}
