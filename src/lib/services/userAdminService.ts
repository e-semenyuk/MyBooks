import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api/errors'
import { AuditService } from '@/lib/services/auditService'
import type { Prisma, UserRole } from '@prisma/client'

export interface UserFilters {
  q?: string
  role?: UserRole
  active?: 'true' | 'false'
  page: number
  pageSize: number
}

const publicFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  emailVerifiedAt: true,
  deactivatedAt: true,
  createdAt: true,
  _count: { select: { orders: true } },
} satisfies Prisma.UserSelect

function shape(row: Prisma.UserGetPayload<{ select: typeof publicFields }>) {
  const { _count, ...rest } = row
  return { ...rest, active: row.deactivatedAt === null, orderCount: _count.orders }
}

export class UserAdminService {
  static async list(filters: UserFilters) {
    const where: Prisma.UserWhereInput = {
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.active ? { deactivatedAt: filters.active === 'true' ? null : { not: null } } : {}),
      ...(filters.q
        ? { OR: [{ email: { contains: filters.q, mode: 'insensitive' } }, { name: { contains: filters.q, mode: 'insensitive' } }] }
        : {}),
    }
    const total = await prisma.user.count({ where })
    const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))
    const page = Math.min(filters.page, totalPages)
    const rows = await prisma.user.findMany({
      where,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * filters.pageSize,
      take: filters.pageSize,
      select: publicFields,
    })
    return { items: rows.map(shape), total, page, pageSize: filters.pageSize, totalPages }
  }

  // Admins cannot change their own role or deactivate themselves, so the shop
  // always keeps at least one admin who can sign in.
  static async update(actorId: number, id: number, change: { role?: UserRole; active?: boolean }) {
    if (id === actorId) {
      throw ApiError.conflict('You cannot change your own role or deactivate your own account', 'SELF_CHANGE')
    }
    const before = await prisma.user.findUnique({ where: { id }, select: publicFields })
    if (!before) throw ApiError.notFound('User not found', 'USER_NOT_FOUND')

    const data: Prisma.UserUpdateInput = {}
    if (change.role !== undefined && change.role !== before.role) data.role = change.role
    if (change.active !== undefined && change.active !== (before.deactivatedAt === null)) {
      data.deactivatedAt = change.active ? null : new Date()
    }
    if (Object.keys(data).length === 0) return shape(before)

    const after = await prisma.user.update({ where: { id }, data, select: publicFields })
    if (data.role) {
      await AuditService.record(actorId, 'USER_ROLE_CHANGED', 'user', id, `${after.email} role ${before.role} to ${after.role}`, {
        from: before.role,
        to: after.role,
      })
    }
    if ('deactivatedAt' in data) {
      await AuditService.record(
        actorId,
        data.deactivatedAt ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
        'user',
        id,
        `${after.email} ${data.deactivatedAt ? 'deactivated' : 'activated'}`
      )
    }
    return shape(after)
  }
}
