'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'

const LIME = '#CCFF00'

export default function VerifierEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D0D0D' }}>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Top banner */}
          <div className="px-8 py-10 text-center" style={{ background: '#1A1A1A' }}>
            <div className="text-5xl mb-4">✉️</div>
            <h1 className="text-xl font-bold text-white">Vérifiez votre email</h1>
          </div>

          {/* Content */}
          <div className="px-8 py-8 text-center space-y-4">
            <p className="text-white/55 text-sm leading-relaxed">
              Un email de confirmation vous a été envoyé. Cliquez sur le lien dans l&apos;email pour activer votre compte.
            </p>
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(204,255,0,0.07)', border: '1px solid rgba(204,255,0,0.15)' }}
            >
              <p className="text-sm" style={{ color: LIME }}>
                Vérifiez également votre dossier spam si vous ne trouvez pas l&apos;email.
              </p>
            </div>
            <div className="pt-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-sm text-white/40">Mauvaise adresse email ?</p>
              <button
                onClick={() => signOut({ callbackUrl: '/register' })}
                className="w-full py-3 rounded-xl font-medium text-sm text-white transition"
                style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
              >
                Créer un nouveau compte
              </button>
              <Link
                href="/login"
                className="block text-sm text-white/35 hover:text-white/60 transition"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
