import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Pages accessibles admin uniquement (pas staff)
const ADMIN_ONLY = [
  '/admin/parametres',
  '/admin/programme',
  '/admin/promotions',
  '/admin/qrcodes',
  '/admin/staff',
  '/admin/pwa',
]

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (path.startsWith('/admin')) {
      // Seuls ADMIN et STAFF ont accès à l'espace admin
      if (token?.role !== 'ADMIN' && token?.role !== 'STAFF') {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      // STAFF ne peut pas accéder aux pages admin uniquement
      if (token?.role === 'STAFF' && ADMIN_ONLY.some(p => path.startsWith(p))) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
    }

    // Bloquer les utilisateurs non vérifiés
    if (token?.emailVerified === false && !path.startsWith('/verifier-email')) {
      return NextResponse.redirect(new URL('/verifier-email', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/carte', '/historique', '/profil', '/offres', '/admin/:path*'],
}
