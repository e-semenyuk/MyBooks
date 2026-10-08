import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { clientIp, loginFailureLimiter, rateLimitingEnabled } from './rateLimit'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // Failed attempts are counted per address and email; successes are not
        const limiterKey = `${clientIp((req?.headers ?? {}) as Record<string, string>)}|${credentials.email.trim().toLowerCase()}`
        if (rateLimitingEnabled()) {
          const retryAfter = loginFailureLimiter().retryAfterSeconds(limiterKey)
          if (retryAfter > 0) {
            throw new Error(`Too many failed attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`)
          }
        }

        // Emails are stored lowercase for new accounts; older rows may differ in case
        const user = await prisma.user.findFirst({
          where: { email: { equals: credentials.email.trim(), mode: 'insensitive' } },
        })

        if (!user) {
          loginFailureLimiter().record(limiterKey)
          throw new Error('Invalid email or password')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          loginFailureLimiter().record(limiterKey)
          throw new Error('Invalid email or password')
        }

        loginFailureLimiter().reset(limiterKey)

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: (user as any).role,
          email: user.email,
          name: user.name,
        }
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          email: token.email as string,
          name: token.name as string,
        }
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

