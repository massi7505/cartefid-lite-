import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    role: string
    emailVerified: boolean
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      emailVerified: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    emailVerified: boolean
  }
}
