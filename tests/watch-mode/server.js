import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'

/**
 * Keep session state outside the workers so reconnecting to a deleted session
 * cannot pass. Only implement the WebDriver commands used by this fixture.
 */
export default function createWebDriverServer() {
    const sessions = new Set()
    const created = []
    const deleted = []
    const navigations = []
    const titles = []
    const unexpected = []
    const server = createServer(async (request, response) => {
        const reply = (status, value) => {
            response.writeHead(status, { 'Content-Type': 'application/json' })
            response.end(JSON.stringify({ value }))
        }

        if (request.method === 'POST' && request.url === '/session') {
            const sessionId = randomUUID()
            sessions.add(sessionId)
            created.push(sessionId)
            return reply(200, { sessionId, capabilities: { browserName: 'chrome' } })
        }

        const [, prefix, sessionId, command] = request.url.split('/')
        if (prefix === 'session' && !sessions.has(sessionId)) {
            return reply(404, { error: 'invalid session id', message: 'Session no longer exists' })
        }
        if (prefix === 'session' && request.method === 'DELETE' && !command) {
            sessions.delete(sessionId)
            deleted.push(sessionId)
            return reply(200, null)
        }
        if (prefix === 'session' && request.method === 'GET' && command === 'title') {
            titles.push(sessionId)
            return reply(200, 'Watch mode')
        }
        if (prefix === 'session' && request.method === 'POST' && command === 'url') {
            try {
                let body = ''
                for await (const chunk of request) {
                    body += chunk
                }
                navigations.push({ sessionId, url: JSON.parse(body).url })
                return reply(200, null)
            } catch (error) {
                unexpected.push(error.message)
                return reply(400, { error: 'invalid argument', message: error.message })
            }
        }

        unexpected.push(`${request.method} ${request.url}`)
        return reply(404, { error: 'unknown command', message: unexpected.at(-1) })
    })

    return { server, sessions, created, deleted, navigations, titles, unexpected }
}
