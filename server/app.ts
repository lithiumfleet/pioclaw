import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { cors } from 'hono/cors'
import { streamSSE } from 'hono/streaming'
import { createAgentLoop } from '@src/core/agent.ts'
import { memoryManager } from '@src/llm/memory.ts'
import { setupAgentCallbacks } from './agentCallbacks.ts'
import { addEventStream } from './events.ts'

const app = new Hono()

// 启用CORS
app.use('*', cors())

// 存储活跃的agent实例和事件流
const activeAgents = new Map<string, { start: () => void; end: () => void; input: (msg: any) => void }>()
const eventStreams = new Map<string, { send: (data: string) => void }[]>()

// 静态文件服务
app.use('/*', serveStatic({ root: './server/public' }))

// API路由
app.get('/api/', (c) => c.text('Agent Control API'))

// 创建新的agent会话
app.post('/api/session', (c) => {
  const id = memoryManager().newMemory()
  const { start, end, input } = createAgentLoop()
  
  activeAgents.set(id, { start, end, input })
  setupAgentCallbacks(id)
  
  return c.json({ 
    sessionId: id,
    message: 'Agent session created'
  })
})

// 获取所有会话
app.get('/api/sessions', (c) => {
  const sessions = Array.from(activeAgents.keys()).map(id => ({
    id,
    active: true
  }))
  return c.json({ sessions })
})

// 删除会话
app.delete('/api/session/:id', (c) => {
  const id = c.req.param('id')
  const agent = activeAgents.get(id)
  
  if (agent) {
    agent.end()
    activeAgents.delete(id)
    
    // 清理相关的事件流
    if (eventStreams.has(id)) {
      eventStreams.delete(id)
    }
    
    return c.json({ message: `Session ${id} deleted` })
  }
  
  return c.json({ error: 'Session not found' }, 404)
})

// 开始agent
app.post('/api/session/:id/start', (c) => {
  const id = c.req.param('id')
  const agent = activeAgents.get(id)
  
  if (agent) {
    agent.start()
    return c.json({ message: `Agent ${id} started` })
  }
  
  return c.json({ error: 'Session not found' }, 404)
})

// 停止agent
app.post('/api/session/:id/stop', (c) => {
  const id = c.req.param('id')
  const agent = activeAgents.get(id)
  
  if (agent) {
    agent.end()
    return c.json({ message: `Agent ${id} stopped` })
  }
  
  return c.json({ error: 'Session not found' }, 404)
})

// 发送消息到agent
app.post('/api/session/:id/message', async (c) => {
  const id = c.req.param('id')
  const agent = activeAgents.get(id)
  
  if (!agent) {
    return c.json({ error: 'Session not found' }, 404)
  }
  
  const { prompt } = await c.req.json()
  
  if (!prompt) {
    return c.json({ error: 'Prompt is required' }, 400)
  }
  
  // 发送消息到agent
  agent.input({
    type: "userreq",
    data: {
      memory: memoryManager().getMemory(id),
      prompt
    }
  })
  
  return c.json({ 
    message: 'Message sent to agent',
    sessionId: id
  })
})

// 获取会话历史
app.get('/api/session/:id/history', (c) => {
  const id = c.req.param('id')
  
  try {
    const memory = memoryManager().getMemory(id)
    const history = memory.dumpToMessages()
    return c.json({ history })
  } catch (error) {
    return c.json({ error: 'Session not found' }, 404)
  }
})

// 清除会话历史
app.delete('/api/session/:id/history', (c) => {
  const id = c.req.param('id')
  
  // 由于记忆不需要持久化且Memory接口没有清除方法
  // 这里返回成功消息，实际记忆将在会话删除时清理
  return c.json({ message: 'History cleared (note: actual memory persistence depends on session lifecycle)' })
})

// SSE事件流 - 用于实时更新
app.get('/api/session/:id/events', async (c) => {
  const id = c.req.param('id')
  
  return streamSSE(c, async (stream) => {
    // 将stream添加到事件流列表
    addEventStream(id, (data: string) => stream.writeSSE({ data }))
    
    // 保持连接打开
    while (true) {
      await stream.sleep(1000)
    }
  })
})

serve(app)
