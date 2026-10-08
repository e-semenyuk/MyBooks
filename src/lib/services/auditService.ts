import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export interface AuditFilters {
  action?: string
  entity?: string
  actorId?: number
  from?: string
  to?: string
  page: number
  pageSize: number
}

export class AuditService {
  // Writing the log must never break the change it describes.
  static async record(
    actorId: number | null,
    action: string,
    entity: string,
    entityId: number | null,
    summary: string,
    details?: Prisma.InputJsonValue
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: { actorId, action, entity, entityId, summary: summary.slice(0, 300), ...(details ? { details } : {}) },
      })
    } catch (error: any) {
      console.error('Audit log write failed:', error?.message ?? error)
    }
  }

  static async list(filters: AuditFilters) {
    const where: Prisma.AuditLogWhereInput = {
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.entity ? { entity: filters.entity } : {}),
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}),
              ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    }
    const total = await prisma.auditLog.count({ where })
    const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))
    const page = Math.min(filters.page, totalPages)
    const items = await prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: { actor: { select: { id: true, name: true, email: true } } },
    })
    return { items, total, page, pageSize: filters.pageSize, totalPages }
  }
}
