import { v4 as uuidv4 } from 'uuid'
import { cookies } from 'next/headers'

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

