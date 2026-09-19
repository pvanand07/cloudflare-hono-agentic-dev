import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const examples = sqliteTable('examples', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
})
