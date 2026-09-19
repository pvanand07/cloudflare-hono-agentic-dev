import { Hono } from 'hono'
import { renderer } from './renderer'
import { exampleApi } from './routes/api/example'
import { pages } from './routes/pages/home'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use(renderer)

app.route('/api/examples', exampleApi)
app.route('/', pages)

export default app
