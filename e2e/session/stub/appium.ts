import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AddressInfo } from 'node:net'

const ELEMENT = 'element-6066-11e4-a52e-4f735466cecf'

const ANDROID_XML = fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'packages', 'wdio-session', 'tests', '__fixtures__', 'pagesource', 'android.xml'),
    'utf-8'
)

export interface RecordedRequest {
    method: string
    path: string
    body: any
}

export interface AppiumStub {
    url: string
    port: number
    requests: RecordedRequest[]
    close: () => Promise<void>
}

function element (id: string) {
    return { [ELEMENT]: id }
}

function elementsFor (body: { using?: string, value?: string }) {
    const using = body?.using || ''
    const value = body?.value || ''
    if (using === 'accessibility id' && value === 'save') {
        return [element('save-1')]
    }
    if (using === 'id' && value === 'com.example:id/save') {
        return [element('save-1')]
    }
    if (using === 'id' && value === 'com.example:id/email') {
        return [element('email-1')]
    }
    if (using === 'xpath' && value.includes('ScrollView')) {
        return [element('scroll-1')]
    }
    if (using === 'xpath' && value.includes('EditText')) {
        return [element('email-1')]
    }
    if (using === 'xpath' && value.includes('CheckBox')) {
        return [element('check-1')]
    }
    if (using === '-android uiautomator' && value.includes('Email')) {
        return [element('email-1')]
    }
    if (using === '-android uiautomator' && value.includes('Save')) {
        return [element('save-1')]
    }
    if (using === '-android uiautomator' && value.includes('Agree')) {
        return [element('check-1')]
    }
    return []
}

/**
 * A tiny WebDriver / Appium server that records requests and serves a fixed
 * Android page source. Enough for `wdio session` to open, snapshot and act.
 */
export function startAppiumStub (): Promise<AppiumStub> {
    const requests: RecordedRequest[] = []
    const server = http.createServer((req, res) => {
        const chunks: Buffer[] = []
        req.on('data', (chunk) => chunks.push(chunk))
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf-8')
            let body: any
            try {
                body = raw ? JSON.parse(raw) : undefined
            } catch {
                body = raw
            }
            const url = new URL(req.url || '/', 'http://127.0.0.1')
            requests.push({ method: req.method || 'GET', path: url.pathname, body })
            const send = (value: unknown, status = 200) => {
                res.writeHead(status, { 'content-type': 'application/json' })
                res.end(JSON.stringify({ value }))
            }
            const pathname = url.pathname.replace(/\/+$/, '') || '/'
            if (req.method === 'POST' && pathname === '/session') {
                const caps = body?.capabilities?.alwaysMatch || body?.capabilities || {}
                return send({ sessionId: 'stub-session', capabilities: caps })
            }
            if (req.method === 'DELETE' && /^\/session\/[^/]+$/.test(pathname)) {
                return send(null)
            }
            if (req.method === 'GET' && pathname.endsWith('/source')) {
                return send(ANDROID_XML)
            }
            if (req.method === 'POST' && pathname.endsWith('/elements')) {
                return send(elementsFor(body || {}))
            }
            if (req.method === 'POST' && /\/element$/.test(pathname)) {
                const found = elementsFor(body || {})
                if (!found.length) {
                    return send({ error: 'no such element', message: 'no such element', stacktrace: '' }, 404)
                }
                return send(found[0])
            }
            if (req.method === 'GET' && pathname.endsWith('/rect')) {
                return send({ x: 0, y: 160, width: 1080, height: 1760 })
            }
            if (req.method === 'POST' && pathname.endsWith('/execute/sync')) {
                const script = String(body?.script || '')
                if (script.includes('queryAppState')) {
                    return send(4)
                }
                return send(null)
            }
            if (req.method === 'POST' && pathname.endsWith('/context')) {
                return send(null)
            }
            if (req.method === 'GET' && pathname.endsWith('/context')) {
                return send('NATIVE_APP')
            }
            if (req.method === 'GET' && pathname.endsWith('/contexts')) {
                return send(['NATIVE_APP', 'WEBVIEW_1'])
            }
            send(null)
        })
    })
    return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address() as AddressInfo
            resolve({
                port,
                url: `http://127.0.0.1:${port}/`,
                requests,
                close: () => new Promise((done) => {
                    server.closeAllConnections()
                    server.close(() => done())
                })
            })
        })
    })
}
