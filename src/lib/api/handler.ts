import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ZodError, ZodType } from 'zod'
import { ApiError } from './errors'
import { InvalidStatusError, InvalidTransitionError } from '@/lib/orderStatus'
import { OrderNotFoundError, OrderRejectedError } from '@/lib/services/orderService'

type Params = Record<string, string>
export type RouteContext = { params: Params | Promise<Params> }

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code, ...(error.details ? { details: error.details } : {}) },
      {
        status: error.status,
        headers:
          error.status === 429 && (error.details as any)?.retryAfterSeconds
            ? { 'Retry-After': String((error.details as any).retryAfterSeconds) }
            : undefined,
      }
    )
  }

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    return NextResponse.json(
      { error: details[0]?.message ?? 'Invalid request', code: 'VALIDATION_ERROR', details },
      { status: 400 }
    )
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: 'Request body must be valid JSON', code: 'INVALID_JSON' },
      { status: 400 }
    )
  }

  if (error instanceof RangeError) {
    return NextResponse.json({ error: error.message, code: 'INVALID_AMOUNT' }, { status: 400 })
  }

  if (error instanceof InvalidStatusError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }
  if (error instanceof InvalidTransitionError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 409 })
  }
  if (error instanceof OrderRejectedError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }
  if (error instanceof OrderNotFoundError) {
    return NextResponse.json({ error: 'Order not found', code: error.code }, { status: 404 })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
    }
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'A referenced item does not exist', code: 'INVALID_REFERENCE' },
        { status: 400 }
      )
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Already exists', code: 'CONFLICT' }, { status: 409 })
    }
  }

  console.error('Unhandled API error:', error)
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}

// Wraps a route so thrown errors become consistent JSON responses.
export function handle(
  fn: (request: NextRequest, context: RouteContext) => Promise<Response>
) {
  return async (request: NextRequest, context: RouteContext): Promise<Response> => {
    try {
      return await fn(request, context)
    } catch (error) {
      return errorResponse(error)
    }
  }
}

export async function parseBody<T>(request: NextRequest, schema: ZodType<T>): Promise<T> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new SyntaxError('Invalid JSON')
  }
  return schema.parse(body)
}

export async function parseId(context: RouteContext, label = 'ID'): Promise<number> {
  const params = await context.params
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest(`Invalid ${label}`, 'INVALID_ID')
  }
  return id
}

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}
