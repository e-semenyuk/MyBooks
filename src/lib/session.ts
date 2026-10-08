import { v4 as uuidv4 } from 'uuid'
import { cookies } from 'next/headers'
import { getOptionalUser } from '@/lib/api/guards'
import type { CartOwner } from '@/lib/cartOwner'

const SESSION_COOKIE_NAME = 'bookstore_session_id'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionId) {
    sessionId = uuidv4()
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  return sessionId
}

export async function getSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value
}


// The cart owner for the current request: the signed-in user if there is one,
// otherwise the guest session cookie (created on first use).
export async function getCartOwner(): Promise<CartOwner> {
  const user = await getOptionalUser()
  if (user) return { kind: 'user', userId: user.id }
  return { kind: 'guest', sessionId: await getOrCreateSessionId() }
}
