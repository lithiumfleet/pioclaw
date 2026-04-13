import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'

const app = new Hono()
app.get('/api/', (c) => c.text('Hono meets Node.js'))
app.use('/*', serveStatic({ root: './server/public' }))

serve(app)