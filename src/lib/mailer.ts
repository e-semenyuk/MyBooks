import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

export interface Email {
  to: string
  subject: string
  text: string
}

// Every email is saved to the outbox first. When SMTP_HOST is set it is also
// sent; without it the message stays in the outbox (and, outside production,
// is printed) so local runs and tests can read the links. Sending never throws:
// a mail problem must not break registration or a reset request.
export async function sendEmail(email: Email): Promise<void> {
  const row = await prisma.emailOutbox.create({
    data: { to: email.to, subject: email.subject, body: email.text },
  })

  const host = process.env.SMTP_HOST
  if (!host) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[email] to=${email.to} subject="${email.subject}"\n${email.text}`)
    }
    return
  }

  try {
    const port = Number(process.env.SMTP_PORT ?? '587')
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      connectionTimeout: 10_000,
      socketTimeout: 15_000,
      ...(process.env.SMTP_USER
        ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' } }
        : {}),
    })
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'Bookstore <no-reply@bookstore.local>',
      to: email.to,
      subject: email.subject,
      text: email.text,
    })
    await prisma.emailOutbox.update({ where: { id: row.id }, data: { sentAt: new Date() } })
  } catch (error: any) {
    console.error('Email sending failed:', error?.message ?? error)
    await prisma.emailOutbox
      .update({ where: { id: row.id }, data: { error: String(error?.message ?? error).slice(0, 500) } })
      .catch(() => undefined)
  }
}
