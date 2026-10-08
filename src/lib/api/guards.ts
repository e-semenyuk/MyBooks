import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ApiError } from './errors'
import { prisma } from '@/lib/prisma'
import { emailVerificationRequired } from '@/lib/config'

export interface SessionUser {
  id: number
  email: string
  name: string
  role: 'USER' | 'ADMIN'
}

export async function getOptionalUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  const user = session.user as any
  const id = Number(user.id)
  if (!Number.isInteger(id)) return null
  return { id, email: user.email, name: user.name, role: user.role }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getOptionalUser()
  if (!user) throw ApiError.unauthorized()
  return user
}

export async function requireAdminUser(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== 'ADMIN') throw ApiError.forbidden()
  return user
}

// Placing an order needs a confirmed email address.
export async function requireVerifiedUser(): Promise<SessionUser> {
  const user = await requireUser()
  if (!emailVerificationRequired()) return user
  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { emailVerifiedAt: true } })
  if (!row?.emailVerifiedAt) {
    throw new ApiError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email address to place orders')
  }
  return user
}
