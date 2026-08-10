// Tiny node:http static file server for the e2e browser cases — serves
// fixture files from a directory on 127.0.0.1, no external network.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const CONTENT_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.json': 'application/json',
}

export function serveDir(dir, port = 0) {
    const server = http.createServer((req, res) => {
        const urlPath = req.url === '/' ? 'index.html' : decodeURIComponent(req.url.slice(1))
        const file = path.join(dir, urlPath)
        // refuse to serve anything outside the fixture dir
        if (!file.startsWith(path.resolve(dir))) {
            res.writeHead(403)
            res.end()
            return
        }
        fs.readFile(file, (err, data) => {
            if (err) {
                res.writeHead(404)
                res.end('not found')
                return
            }
            res.writeHead(200, { 'content-type': CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream' })
            res.end(data)
        })
    })
    return new Promise((resolve) => {
        server.listen(port, '127.0.0.1', () => {
            const addr = server.address()
            resolve({
                url: `http://127.0.0.1:${addr.port}`,
                close: () => new Promise((r) => server.close(r)),
            })
        })
    })
}
