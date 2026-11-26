import { readFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { fileURLToPath } from 'node:url'
import type { TestProject } from 'vitest/node'

declare module 'vitest' {
    export interface ProvidedContext {
        baseUrl: string
    }
}

const FIXTURE_PAGE = fileURLToPath(new URL('./fixtures/index.html', import.meta.url))

export default async function setup (project: TestProject) {
    const html = await readFile(FIXTURE_PAGE)
    const server: Server = createServer((_request, response) => {
        response.writeHead(200, { 'content-type': 'text/html' })
        response.end(html)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address() as AddressInfo
    project.provide('baseUrl', `http://127.0.0.1:${port}`)

    return () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}
