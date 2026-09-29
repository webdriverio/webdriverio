import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const which = args.find((arg) => arg === 'browser' || arg === 'mobile')

function flag (name) {
    const index = args.indexOf(name)
    return index === -1 ? undefined : args[index + 1]
}

if (!which) {
    console.error('Usage: node examples/session/serve.js <browser|mobile> [--host 127.0.0.1] [--port 4173]')
    process.exit(2)
}

const host = flag('--host') || '127.0.0.1'
const port = Number(flag('--port') || (which === 'mobile' ? 4174 : 4173))
if (!Number.isInteger(port) || port < 1) {
    console.error(`Invalid port "${flag('--port')}".`)
    process.exit(2)
}

const dir = path.join(root, which)
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json'
}

/**
 * Serve one demo directory. The postcard reads `/api/weather`, which returns
 * clear skies until `wdio session mock` replaces it.
 */
const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://localhost')
    if (which === 'browser' && url.pathname === '/api/weather') {
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' })
        res.end(JSON.stringify({ condition: 'clear' }))
        return
    }
    const rel = decodeURIComponent(url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, ''))
    const file = path.resolve(dir, rel)
    if (file !== dir && !file.startsWith(dir + path.sep)) {
        res.writeHead(404, { 'content-type': 'text/plain' })
        res.end('not found')
        return
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404, { 'content-type': 'text/plain' })
        res.end('not found')
        return
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' })
    fs.createReadStream(file).pipe(res)
})

server.listen(port, host, () => {
    const name = which === 'browser' ? 'Postcard' : 'Boarding pass'
    console.log(`${name}  http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`)
    if (host === '0.0.0.0') {
        for (const entries of Object.values(os.networkInterfaces())) {
            for (const entry of entries || []) {
                if (entry.family === 'IPv4' && !entry.internal) {
                    console.log(`         http://${entry.address}:${port}`)
                }
            }
        }
    }
})
