import { NextAuthOptions, Session } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) return null

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
        token.emailVerified = (user as { emailVerified: boolean }).emailVerified
      } else if (token.id) {
        // Invalidate token if password was changed after it was issued
        const dbUser = await prisma.user.findUnique({
          where: { id: Number(token.id) },
          select: { passwordChangedAt: true },
        })
        if (
          dbUser?.passwordChangedAt &&
          typeof token.iat === 'number' &&
          dbUser.passwordChangedAt.getTime() > token.iat * 1000
        ) {
          return { ...token, invalid: true }
        }
      }
      return token
    },
    async session({ session, token }) {
      if ((token as { invalid?: boolean }).invalid) {
        // Password changed after token was issued — force re-login
        return null as unknown as Session
      }
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.emailVerified = token.emailVerified as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}
