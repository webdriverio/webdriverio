import { once } from 'node:events'
import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import { createServer, type Server } from 'node:http'

const FIXTURE_DIR = path.join(path.dirname(url.fileURLToPath(import.meta.url)), 'headless', '__fixtures__', 'parallel')

export const PARALLEL_FIXTURE_PORT = 4598
const PARALLEL_FIXTURE_HOST = '127.0.0.1'
export const PARALLEL_FIXTURE_ORIGIN = `http://${PARALLEL_FIXTURE_HOST}:${PARALLEL_FIXTURE_PORT}`

export async function startParallelFixtureServer(): Promise<Server> {
    const server = createServer(async (request, response) => {
        const name = new URL(request.url ?? '/', PARALLEL_FIXTURE_ORIGIN).pathname.replace(/^\/|\/$/g, '') || 'index'
        try {
            const body = await fs.readFile(path.join(FIXTURE_DIR, `${path.basename(name)}.html`))
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(body)
        } catch {
            response.statusCode = 404
            response.end('Not found')
        }
    })
    server.listen(PARALLEL_FIXTURE_PORT, PARALLEL_FIXTURE_HOST)
    await once(server, 'listening')
    return server
}

export async function stopParallelFixtureServer(server?: Server): Promise<void> {
    if (!server) {
        return
    }
    const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    server.closeAllConnections()
    await closed
}
