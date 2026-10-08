import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ApiError } from './errors'

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
