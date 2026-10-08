import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api/errors'
import { TOKEN_TTL_MS, generateToken, hashToken } from '@/lib/tokens'
import { passwordResetEmail, verificationEmail } from '@/lib/emails'
import { sendEmail } from '@/lib/mailer'
import { emailVerificationRequired } from '@/lib/config'
import type { TokenPurpose } from '@prisma/client'

export class AccountService {
  // A new token replaces any unused one of the same kind, so only the latest
  // link in the inbox works.
  private static async issueToken(userId: number, purpose: TokenPurpose): Promise<string> {
    const { raw, hash } = generateToken()
    await prisma.$transaction([
      prisma.authToken.deleteMany({ where: { userId, purpose, usedAt: null } }),
      prisma.authToken.create({
        data: { userId, purpose, tokenHash: hash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS[purpose]) },
      }),
    ])
    return raw
  }

  // Marks the token used in one atomic step, so a link can never work twice.
  private static async consume(raw: string, purpose: TokenPurpose): Promise<number> {
    const token = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(raw) } })
    if (!token || token.purpose !== purpose || token.usedAt) {
      throw ApiError.badRequest('This link is not valid. Request a new one.', 'TOKEN_INVALID')
    }
    if (token.expiresAt.getTime() <= Date.now()) {
      throw ApiError.badRequest('This link has expired. Request a new one.', 'TOKEN_EXPIRED')
    }
    const claimed = await prisma.authToken.updateMany({
      where: { id: token.id, usedAt: null },
      data: { usedAt: new Date() },
    })
    if (claimed.count === 0) {
      throw ApiError.badRequest('This link is not valid. Request a new one.', 'TOKEN_INVALID')
    }
    return token.userId
  }

  static async sendVerification(user: { id: number; email: string; name: string }): Promise<void> {
    const token = await this.issueToken(user.id, 'EMAIL_VERIFICATION')
    await sendEmail(verificationEmail(user.email, user.name, token))
  }

  static async resendVerification(userId: number): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw ApiError.notFound('Account not found', 'USER_NOT_FOUND')
    if (user.emailVerifiedAt) throw ApiError.conflict('Your email address is already verified', 'ALREADY_VERIFIED')
    await this.sendVerification(user)
  }

  static async verifyEmail(raw: string): Promise<void> {
    const userId = await this.consume(raw, 'EMAIL_VERIFICATION')
    await prisma.user.updateMany({ where: { id: userId, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } })
  }

  // The caller answers the same way whether or not the address has an account.
  static async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } })
    if (!user) return
    const token = await this.issueToken(user.id, 'PASSWORD_RESET')
    await sendEmail(passwordResetEmail(user.email, user.name, token))
  }

  static async resetPassword(raw: string, password: string): Promise<void> {
    const userId = await this.consume(raw, 'PASSWORD_RESET')
    const hashed = await bcrypt.hash(password, 10)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        // Following an emailed link proves the address; a reset also clears any lock
        data: { password: hashed, failedLogins: 0, lastFailedLoginAt: null, lockedUntil: null },
      }),
      prisma.user.updateMany({ where: { id: userId, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } }),
      prisma.authToken.deleteMany({ where: { userId, purpose: 'PASSWORD_RESET', usedAt: null } }),
    ])
  }

  static async me(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true, emailVerifiedAt: true, locale: true,
        _count: { select: { pushSubscriptions: true } },
      },
    })
    if (!user) throw ApiError.notFound('Account not found', 'USER_NOT_FOUND')
    const { emailVerifiedAt, _count, ...rest } = user
    // When verification is not enforced nobody is asked to do it
    return {
      ...rest,
      emailVerified: emailVerifiedAt !== null || !emailVerificationRequired(),
      pushEnabled: _count.pushSubscriptions > 0,
    }
  }

  static async setLocale(userId: number, locale: string) {
    await prisma.user.update({ where: { id: userId }, data: { locale } })
    return this.me(userId)
  }
}
