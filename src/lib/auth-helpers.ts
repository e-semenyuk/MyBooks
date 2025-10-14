import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      ),
      session: null,
    }
  }
  
  return { error: null, session }
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      ),
      session: null,
    }
  }
  
  if ((session.user as any).role !== 'ADMIN') {
    return {
      error: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      ),
      session: null,
    }
  }
  
  return { error: null, session }
}

