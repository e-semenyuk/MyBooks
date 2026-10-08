import { NextResponse } from 'next/server'
import { buildOpenApi } from '@/lib/openapi/spec'

// GET /api/openapi - the API description as OpenAPI 3.1 JSON
export async function GET() {
  return NextResponse.json(buildOpenApi())
}
