import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { afterFailedLogin, lockedMessage, lockedMinutes } from './lockout'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // Emails are stored lowercase for new accounts; older rows may differ in case
        const user = await prisma.user.findFirst({
          where: { email: { equals: credentials.email.trim(), mode: 'insensitive' } },
        })

        if (!user) {
          throw new Error('Invalid email or password')
        }

        // A locked account refuses even the right password until the lock ends
        const now = new Date()
        const minutesLeft = lockedMinutes(user.lockedUntil, now)
        if (minutesLeft > 0) {
          throw new Error(lockedMessage(minutesLeft))
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          const next = afterFailedLogin(user, now)
          await prisma.user.update({ where: { id: user.id }, data: next })
          if (next.lockedUntil) {
            throw new Error(lockedMessage(lockedMinutes(next.lockedUntil, now)))
          }
          throw new Error('Invalid email or password')
        }

        if (user.failedLogins > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLogins: 0, lastFailedLoginAt: null, lockedUntil: null },
          })
        }

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

