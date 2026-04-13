import { registerAgentCallbacks } from '@src/handlers/callbacks.ts'
import { sendEvent } from './events.ts'

// 存储每个会话的累积输出
const sessionBuffers = new Map<string, {
  llmBuffer: string
  reasoningBuffer: string
}>()

export function setupAgentCallbacks(sessionId: string) {
  // 初始化会话缓冲区
  sessionBuffers.set(sessionId, {
    llmBuffer: '',
    reasoningBuffer: ''
  })

  // 注册回调函数
  registerAgentCallbacks(
    // onChunk - LLM 输出流式回调（单字）
    (chunk: string) => {
      const buffer = sessionBuffers.get(sessionId)
      if (buffer) {
        buffer.llmBuffer += chunk
        
        // 发送流式更新事件
        sendEvent(sessionId, 'llm_chunk', {
          chunk,
          accumulated: buffer.llmBuffer
        })
      }
    },
    
    // onReasoningChunk - 推理输出流式回调（单字）
    (chunk: string) => {
      const buffer = sessionBuffers.get(sessionId)
      if (buffer) {
        buffer.reasoningBuffer += chunk
        
        // 发送流式更新事件
        sendEvent(sessionId, 'reasoning_chunk', {
          chunk,
          accumulated: buffer.reasoningBuffer
        })
      }
    },
    
    // onToolRes - 工具调用结果回调（完整）
    (result: string) => {
      // 发送工具调用结果事件
      sendEvent(sessionId, 'tool_result', {
        result
      })
      
      // 同时重置相关缓冲区（可选）
      const buffer = sessionBuffers.get(sessionId)
      if (buffer) {
        // 可以选择不清除缓冲区，保留完整输出
        // 或者如果需要，可以在这里进行清理
      }
    }
  )
}

export function cleanupAgentCallbacks(sessionId: string) {
  // 清理会话缓冲区
  sessionBuffers.delete(sessionId)
}

export function getSessionBuffer(sessionId: string) {
  return sessionBuffers.get(sessionId)
}

export function clearSessionBuffer(sessionId: string) {
  const buffer = sessionBuffers.get(sessionId)
  if (buffer) {
    buffer.llmBuffer = ''
    buffer.reasoningBuffer = ''
  }
}