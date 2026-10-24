import http from 'node:http'
import type { AddressInfo } from 'node:net'

/**
 * Pages with one solid color: `/<hex>?to=<hex>` (a click on `#btn` paints `to`).
 * The center pixel of a frame tells which test the frame shows.
 */
export function startColorServer () {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const color = url.pathname.slice(1)
        const to = url.searchParams.get('to') ?? '000000'
        res.writeHead(200, { 'content-type': 'text/html' })
        res.end(`<!doctype html><html><head><style>html,body{margin:0;height:100%;background:#${color}}</style></head>` +
            `<body><button id="btn" onclick="document.body.style.background='#${to}'">to</button></body></html>`)
    })
    return new Promise<{ server: http.Server, origin: string }>((resolve) => server.listen(0, () => resolve({
        server,
        origin: `http://localhost:${(server.address() as AddressInfo).port}`
    })))
}

/**
 * the 2 colors of each test of `video.parallel.e2e.ts`
 */
export const COLORS = {
    'red test': ['ff0000', '800000'],
    'blue test': ['0000ff', '000080'],
    'green test': ['00ff00', '008000'],
    'yellow test': ['ffff00', '808000']
} as const
