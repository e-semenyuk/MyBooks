import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { handle, json, parseBody } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'
import { registerSchema } from '@/lib/validation/schemas'
import { clientIp, rateLimitingEnabled, registerLimiter } from '@/lib/rateLimit'

export const POST = handle(async (request) => {
  if (rateLimitingEnabled()) {
    const ip = clientIp(request.headers)
    const retryAfter = registerLimiter().retryAfterSeconds(ip)
    if (retryAfter > 0) {
      throw ApiError.tooManyRequests('Too many registration attempts. Try again later.', retryAfter)
    }
    registerLimiter().record(ip)
  }

  const { email, password, name } = await parseBody(request, registerSchema)

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  })

  if (existingUser) {
    throw ApiError.badRequest('User with this email already exists', 'EMAIL_TAKEN')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name, role: 'USER' },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })

  return json({ message: 'User registered successfully', user }, 201)
})
