import http from 'node:http'
import type { AddressInfo } from 'node:net'

/**
 * Pages with one solid color: `/<hex>`. Each test of the parallel run opens its own
 * color, so its screenshots differ from the screenshots of the other tests.
 */
export function startColorServer () {
    const server = http.createServer((req, res) => {
        const color = new URL(req.url ?? '/', 'http://localhost').pathname.slice(1)
        res.writeHead(200, { 'content-type': 'text/html' })
        res.end(`<!doctype html><html><head><title>${color}</title>` +
            `<style>html,body{margin:0;height:100%;background:#${color}}</style></head><body></body></html>`)
    })
    return new Promise<{ server: http.Server, origin: string }>((resolve) => server.listen(0, () => resolve({
        server,
        origin: `http://localhost:${(server.address() as AddressInfo).port}`
    })))
}
