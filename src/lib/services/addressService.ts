import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api/errors'
import { MAX_ADDRESSES_PER_USER } from '@/lib/address'
import type { z } from 'zod'
import type { addressSchema } from '@/lib/validation/schemas'

export type AddressInput = z.infer<typeof addressSchema>

// Every query includes the user id, so one user can never read or change
// another user's address: those requests look like "not found".
export class AddressService {
  static list(userId: number) {
    return prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
  }

  static async create(userId: number, input: AddressInput) {
    const count = await prisma.address.count({ where: { userId } })
    if (count >= MAX_ADDRESSES_PER_USER) {
      throw ApiError.conflict(`You can save up to ${MAX_ADDRESSES_PER_USER} addresses`, 'ADDRESS_LIMIT')
    }
    return prisma.address.create({ data: { ...input, userId } })
  }

  static async update(userId: number, id: number, input: AddressInput) {
    const result = await prisma.address.updateMany({ where: { id, userId }, data: input })
    if (result.count === 0) throw ApiError.notFound('Address not found', 'ADDRESS_NOT_FOUND')
    return prisma.address.findUniqueOrThrow({ where: { id } })
  }

  static async remove(userId: number, id: number) {
    const result = await prisma.address.deleteMany({ where: { id, userId } })
    if (result.count === 0) throw ApiError.notFound('Address not found', 'ADDRESS_NOT_FOUND')
  }
}
