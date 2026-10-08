import { mkdirSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { buildOpenApi } from '../src/lib/openapi/spec'

const target = resolve(__dirname, '../docs/openapi.json')
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, JSON.stringify(buildOpenApi(), null, 2) + '\n')
console.log(`Wrote ${target}`)
