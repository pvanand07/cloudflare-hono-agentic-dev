import { Hono } from 'hono'

export const pages = new Hono()

pages.get('/', (c) => {
  return c.render(<h1>Project Template</h1>)
})
