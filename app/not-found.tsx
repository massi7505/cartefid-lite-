import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: '#0D0D0D' }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-black text-4xl mb-8"
        style={{ background: '#CCFF00' }}
      >
        S
      </div>

      <p className="text-8xl font-black" style={{ color: '#CCFF00' }}>404</p>
      <p className="text-xl font-bold text-white mt-4">Page introuvable</p>
      <p className="text-white/40 text-sm mt-2 text-center max-w-xs">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>

      <Link
        href="/"
        className="mt-10 px-6 py-3 rounded-xl font-bold text-sm text-black transition hover:opacity-90"
        style={{ background: '#CCFF00' }}
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  )
}
