import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDb } from '../../db/client'
import { examples } from '../../db/schema'

export const exampleApi = new Hono<{ Bindings: CloudflareBindings }>()

const createSchema = z.object({ name: z.string() })

exampleApi.get('/', async (c) => {
  const db = getDb(c.env.DB)
  const rows = await db.select().from(examples)
  return c.json(rows)
})

exampleApi.post('/', zValidator('json', createSchema), async (c) => {
  const { name } = c.req.valid('json')
  const db = getDb(c.env.DB)
  const [row] = await db.insert(examples).values({ name }).returning()
  return c.json(row)
})
