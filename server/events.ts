// 事件发送模块 - 避免循环依赖

const eventStreams = new Map<string, { send: (data: string) => void }[]>()

export function sendEvent(sessionId: string, eventType: string, data: any) {
  const streams = eventStreams.get(sessionId)
  if (streams) {
    const eventData = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() })
    streams.forEach(stream => {
      try {
        stream.send(eventData)
      } catch (error) {
        // 移除失效的流
        console.error('Error sending event:', error)
      }
    })
  }
}

export function addEventStream(sessionId: string, send: (data: string) => void) {
  if (!eventStreams.has(sessionId)) {
    eventStreams.set(sessionId, [])
  }
  eventStreams.get(sessionId)!.push({ send })
}

export function removeEventStreams(sessionId: string) {
  eventStreams.delete(sessionId)
}

export function getEventStreams(sessionId: string) {
  return eventStreams.get(sessionId) || []
}