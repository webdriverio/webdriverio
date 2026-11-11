import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import url from 'node:url'
import http from 'node:http'
import { spawn } from 'node:child_process'
import type { AddressInfo } from 'node:net'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
export const FIXTURES = path.join(__dirname, '__fixtures__')
export const SITE = path.join(FIXTURES, 'site')
const WDIO_BIN = path.resolve(__dirname, '..', '..', 'packages', 'wdio-cli', 'bin', 'wdio.js')

const MIME: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.txt': 'text/plain'
}

export interface FixtureServer {
    url: string
    port: number
    close: () => Promise<void>
}

/**
 * Serve `__fixtures__/site` plus a few API routes used by the network tests.
 */
export function startServer (root = SITE): Promise<FixtureServer> {
    const server = http.createServer((req, res) => {
        const reqUrl = new URL(req.url || '/', 'http://localhost')
        if (reqUrl.pathname === '/api/user') {
            res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
            return res.end(JSON.stringify({ name: 'Real User' }))
        }
        if (reqUrl.pathname === '/api/forbidden') {
            res.writeHead(403, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
            return res.end('{"message":"forbidden"}')
        }
        if (reqUrl.pathname === '/api/slow') {
            return setTimeout(() => {
                res.writeHead(200, { 'content-type': 'text/plain' })
                res.end('slow')
            }, 1000)
        }
        const file = path.join(root, decodeURIComponent(reqUrl.pathname === '/' ? '/index.html' : reqUrl.pathname))
        if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
            res.writeHead(404, { 'content-type': 'text/plain' })
            return res.end('not found')
        }
        res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' })
        fs.createReadStream(file).pipe(res)
    })
    return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address() as AddressInfo
            resolve({
                port,
                url: `http://localhost:${port}`,
                close: () => new Promise((r) => {
                    server.closeAllConnections()
                    server.close(() => r())
                })
            })
        })
    })
}

export interface RunResult {
    code: number
    stdout: string
    stderr: string
    json?: any
}

export interface Project {
    dir: string
    runtimeDir: string
    env: NodeJS.ProcessEnv
    run: (args: string[], opts?: RunOptions) => Promise<RunResult>
    wdio: (args: string[], opts?: RunOptions) => Promise<RunResult>
    start: (args: string[], opts?: RunOptions) => BackgroundRun
    cleanup: () => Promise<void>
}

export interface RunOptions {
    stdin?: string
    env?: NodeJS.ProcessEnv
    cwd?: string
    timeout?: number
}

export interface BackgroundRun {
    stdout: () => string
    stderr: () => string
    result: Promise<RunResult>
    kill: () => void
}

/**
 * Start `wdio <args>` and return before it exits.
 */
export function startWdio (args: string[], opts: RunOptions = {}): BackgroundRun {
    const child = spawn(process.execPath, [WDIO_BIN, ...args], {
        cwd: opts.cwd,
        env: { ...process.env, NO_COLOR: '1', ...opts.env },
        stdio: ['ignore', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    const result = new Promise<RunResult>((resolve) => {
        child.on('close', (code) => {
            resolve({ code: code ?? 1, stdout, stderr })
        })
    })
    return {
        stdout: () => stdout,
        stderr: () => stderr,
        result,
        kill: () => {
            if (child.exitCode === null && !child.killed) {
                child.kill('SIGTERM')
            }
        }
    }
}

export function runWdio (args: string[], opts: RunOptions = {}): Promise<RunResult> {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [WDIO_BIN, ...args], {
            cwd: opts.cwd,
            env: { ...process.env, NO_COLOR: '1', ...opts.env },
            stdio: [opts.stdin === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe']
        })
        let stdout = ''
        let stderr = ''
        child.stdout.on('data', (d) => (stdout += d))
        child.stderr.on('data', (d) => (stderr += d))
        const timer = setTimeout(() => {
            child.kill('SIGKILL')
            reject(new Error(`wdio ${args.join(' ')} timed out\nstdout: ${stdout}\nstderr: ${stderr}`))
        }, opts.timeout ?? 120_000)
        if (opts.stdin !== undefined) {
            child.stdin!.end(opts.stdin)
        }
        child.on('close', (code) => {
            clearTimeout(timer)
            let json: any
            if (args.includes('--json')) {
                try {
                    json = JSON.parse(stdout)
                } catch {
                    json = undefined
                }
            }
            resolve({ code: code ?? 1, stdout, stderr, json })
        })
    })
}

/**
 * Run `wdio session …` as a child process.
 */
export function runSession (args: string[], opts: RunOptions = {}): Promise<RunResult> {
    return runWdio(['session', ...args], opts)
}

/**
 * A temp project dir with its own runtime dir, so tests never see the
 * user's sessions.
 */
export function createProject (name = 'proj'): Project {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `wdio-session-${name}-`))
    const runtimeDir = path.join(dir, 'run')
    const env = { WDIO_SESSION_DIR: runtimeDir }
    const project: Project = {
        dir,
        runtimeDir,
        env,
        run: (args, opts = {}) => runSession(args, { cwd: dir, ...opts, env: { ...env, ...opts.env } }),
        wdio: (args, opts = {}) => runWdio(args, { cwd: dir, ...opts, env: { ...env, ...opts.env } }),
        start: (args, opts = {}) => startWdio(args, { cwd: dir, ...opts, env: { ...env, ...opts.env } }),
        cleanup: async () => {
            await runSession(['close', '--all'], { cwd: dir, env }).catch(() => {})
            fs.rmSync(dir, { recursive: true, force: true })
        }
    }
    return project
}

export function readState (project: Project, name = 'default') {
    return JSON.parse(fs.readFileSync(path.join(project.runtimeDir, `${name}.json`), 'utf-8'))
}

export function isAlive (pid: number) {
    try {
        process.kill(pid, 0)
        return true
    } catch {
        return false
    }
}

export async function waitFor (fn: () => boolean | Promise<boolean>, timeout = 10_000, interval = 100) {
    const start = Date.now()
    while (Date.now() - start < timeout) {
        if (await fn()) {
            return true
        }
        await new Promise((r) => setTimeout(r, interval))
    }
    return false
}

/**
 * PIDs of all descendants of a process (Linux/macOS)
 */
export function descendants (pid: number): number[] {
    const parents = new Map<number, number[]>()
    let entries: string[] = []
    try {
        entries = fs.readdirSync('/proc').filter((e) => /^\d+$/.test(e))
    } catch {
        return []
    }
    for (const entry of entries) {
        try {
            const stat = fs.readFileSync(`/proc/${entry}/stat`, 'utf-8')
            const ppid = Number(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[1])
            parents.set(ppid, [...(parents.get(ppid) || []), Number(entry)])
        } catch {
            // process gone
        }
    }
    const out: number[] = []
    const queue = [pid]
    while (queue.length) {
        for (const child of parents.get(queue.shift()!) || []) {
            out.push(child)
            queue.push(child)
        }
    }
    return out
}
