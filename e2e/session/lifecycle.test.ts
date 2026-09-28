import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import net from 'node:net'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'

import { getBuildIdByChromePath } from '../../packages/wdio-utils/src/node/utils.ts'
import { createProject, descendants, isAlive, readState, startServer, waitFor, type FixtureServer, type Project } from './helpers.js'

const requireFromUtils = createRequire(path.resolve(import.meta.dirname, '../../packages/wdio-utils/package.json'))

function comm (pid: number) {
    try {
        return fs.readFileSync(`/proc/${pid}/comm`, 'utf-8').trim()
    } catch {
        return ''
    }
}

function killAll (pids: number[]) {
    for (const pid of pids) {
        try {
            process.kill(pid, 'SIGKILL')
        } catch {
            // already gone
        }
    }
}

describe('wdio session lifecycle', () => {
    let server: FixtureServer
    let project: Project
    let url: string

    beforeAll(async () => {
        server = await startServer()
        url = `${server.url}/index.html`
    })

    afterAll(async () => {
        await server.close()
    })

    afterEach(async () => {
        await project?.cleanup()
    })

    it('opens Chrome and serves 100 sequential requests from the same session', async () => {
        project = createProject('lifecycle')
        const open = await project.run(['open', 'chrome', url, '--json'])
        expect(open.code, open.stderr).toBe(0)
        expect(open.json.result.text).toMatch(/^Session "default" ready: chrome [\d.]+ \(headless\) · http:\/\/localhost:\d+\/index\.html/)

        const info = await project.run(['info', '--json'])
        expect(info.code).toBe(0)
        expect(info.json.result.data).toMatchObject({ bidi: true, browserName: 'chrome', url, title: 'Session Fixture' })
        const { sessionId } = info.json.result.data
        expect(sessionId).toEqual(expect.any(String))

        for (let i = 0; i < 100; i++) {
            const res = await project.run(['info', '--json'])
            expect(res.code, res.stderr).toBe(0)
            expect(res.json.result.data.sessionId).toBe(sessionId)
        }

        const status = await project.run(['status'])
        expect(status).toMatchObject({ code: 0, stdout: 'running\n' })
        const close = await project.run(['close'])
        expect(close).toMatchObject({ code: 0, stdout: 'Closed "default"\n' })
        expect(await project.run(['status'])).toMatchObject({ code: 4, stdout: 'not running\n' })
        const gone = await project.run(['info', '--json'])
        expect(gone.code).toBe(4)
        expect(gone.json.error.code).toBe('SESSION_NOT_FOUND')
    }, 180_000)

    it('runs named sessions side by side, refuses duplicates and replaces on request', async () => {
        project = createProject('lifecycle')
        const [a, b] = await Promise.all([
            project.run(['open', 'chrome', url, '-s', 'a']),
            project.run(['open', 'chrome', `${server.url}/form.html`, '-s', 'b'])
        ])
        expect(a.code, a.stderr).toBe(0)
        expect(b.code, b.stderr).toBe(0)

        const list = await project.run(['list', '--json'])
        expect(list.json.result.data.sessions.map((s: { name: string }) => s.name).sort()).toEqual(['a', 'b'])
        expect(list.json.result.data.sessions[0].token).toBe(undefined)
        const text = await project.run(['list'])
        expect(text.stdout).toMatch(/^a\s+chrome [\d.]+\s+http:\/\/localhost:\d+\/index\.html\s+\d+s$/m)

        const before = (await project.run(['info', '-s', 'a', '--json'])).json.result.data.sessionId
        const dup = await project.run(['open', 'chrome', '-s', 'a', '--json'])
        expect(dup.code).toBe(1)
        expect(dup.json.error.code).toBe('SESSION_EXISTS')
        expect(dup.json.error.hint).toContain('wdio session close -s a')

        const replaced = await project.run(['open', 'chrome', url, '-s', 'a', '--replace', '--json'])
        expect(replaced.code, replaced.stderr).toBe(0)
        expect(replaced.json.result.data.sessionId).not.toBe(before)
        expect((await project.run(['info', '-s', 'b', '--json'])).json.result.data.url).toBe(`${server.url}/form.html`)
    }, 120_000)

    it('shuts down within 10s when the browser dies', async () => {
        project = createProject('lifecycle')
        expect((await project.run(['open', 'chrome', url])).code).toBe(0)
        const { pid } = readState(project)
        const tree = descendants(pid)
        const browsers = tree.filter((p) => comm(p) === 'chrome')
        expect(browsers.length).toBeGreaterThan(0)
        const started = Date.now()
        killAll(browsers)
        expect(await waitFor(() => !isAlive(pid), 10_000)).toBe(true)
        expect(Date.now() - started).toBeLessThan(10_000)
        expect(await waitFor(() => tree.every((p) => !isAlive(p)), 5_000)).toBe(true)
        const info = await project.run(['info', '--json'])
        expect(info.code).toBe(4)
    }, 60_000)

    it('detects a killed daemon as stale', async () => {
        project = createProject('lifecycle')
        expect((await project.run(['open', 'chrome', url])).code).toBe(0)
        const { pid } = readState(project)
        const children = descendants(pid)
        expect(children.some((p) => comm(p) === 'chrome')).toBe(true)
        process.kill(pid, 'SIGKILL')
        await waitFor(() => !isAlive(pid))
        expect(children.every((p) => isAlive(p))).toBe(true)

        const list = await project.run(['list', '--json'])
        expect(list.code).toBe(0)
        expect(list.json.result.data).toEqual({ sessions: [], stale: ['default'] })
        expect(await waitFor(() => children.every((p) => !isAlive(p)), 5_000)).toBe(true)
        expect(fs.existsSync(path.join(project.runtimeDir, 'default.json'))).toBe(false)
        expect((await project.run(['info'])).code).toBe(4)
    }, 60_000)

    it('stops after the idle timeout', async () => {
        project = createProject('lifecycle')
        expect((await project.run(['open', 'chrome', url, '--idle-timeout', '2s'])).code).toBe(0)
        const { pid } = readState(project)
        const children = descendants(pid)
        expect((await project.run(['info'])).code).toBe(0)
        const last = Date.now()
        expect(await waitFor(() => !isAlive(pid), 10_000)).toBe(true)
        expect(Date.now() - last).toBeLessThan(5_000)
        expect(await waitFor(() => children.every((c) => !isAlive(c)), 5_000)).toBe(true)
        expect(fs.existsSync(path.join(project.runtimeDir, 'default.json'))).toBe(false)
    }, 60_000)

    it('restricts runtime files and rejects requests with a wrong token', async () => {
        project = createProject('lifecycle')
        expect((await project.run(['open', 'chrome', url])).code).toBe(0)
        const state = readState(project)
        expect(fs.statSync(project.runtimeDir).mode & 0o777).toBe(0o700)
        expect(fs.statSync(state.socket).mode & 0o777).toBe(0o600)
        expect(fs.statSync(path.join(project.runtimeDir, 'default.json')).mode & 0o777).toBe(0o600)

        const reply = await new Promise<string>((resolve, reject) => {
            const socket = net.createConnection(state.socket)
            let data = ''
            socket.setEncoding('utf-8')
            socket.on('connect', () => socket.write(JSON.stringify({ v: 1, id: 'x', token: 'f'.repeat(64), action: 'close', args: {} }) + '\n'))
            socket.on('data', (d) => (data += d))
            socket.on('end', () => resolve(data))
            socket.on('error', reject)
        })
        expect(JSON.parse(reply)).toMatchObject({ ok: false, error: { code: 'INTERNAL', message: 'Invalid session token.' } })
        expect((await project.run(['status'])).code).toBe(0)
    }, 60_000)

    it('restarts with the same flags and keeps the history', async () => {
        project = createProject('lifecycle')
        expect((await project.run(['open', 'chrome', url, '--viewport', '800x600'])).code).toBe(0)
        const before = (await project.run(['info', '--json'])).json.result.data
        const restart = await project.run(['restart', '--json'])
        expect(restart.code, restart.stderr).toBe(0)
        const after = (await project.run(['info', '--json'])).json.result.data
        expect(after.sessionId).not.toBe(before.sessionId)
        expect(after.url).toBe(url)
        const history = JSON.parse(fs.readFileSync(path.join(project.dir, '.wdio', 'session', 'default', 'history.json'), 'utf-8'))
        expect(history.map((h: { kind: string, code: string }) => [h.kind, h.code])).toEqual([
            ['open', `await browser.url('${url}')`],
            ['marker', '// restart'],
            ['open', `await browser.url('${url}')`]
        ])
    }, 90_000)

    it('close --all leaves no daemon, driver or browser processes', async () => {
        project = createProject('lifecycle')
        await Promise.all(['one', 'two'].map((name) => project.run(['open', 'chrome', url, '-s', name])))
        const daemons = ['one', 'two'].map((name) => readState(project, name).pid as number)
        const tree = daemons.flatMap((pid) => [pid, ...descendants(pid)])
        expect(tree.some((p) => comm(p) === 'chromedriver')).toBe(true)
        expect(tree.some((p) => comm(p) === 'chrome')).toBe(true)

        const close = await project.run(['close', '--all'])
        expect(close.code).toBe(0)
        expect(close.stdout.trim().split('\n').sort()).toEqual(['Closed "one"', 'Closed "two"'])
        expect(await waitFor(() => tree.every((p) => !isAlive(p)), 10_000)).toBe(true)
        expect(fs.readdirSync(project.runtimeDir)).toEqual([])
    }, 90_000)

    it('uses a remote WebDriver endpoint and leaves it running on close', async () => {
        project = createProject('lifecycle')
        const downloaded = fs.globSync(path.join(os.tmpdir(), 'chromedriver', '*', 'chromedriver-*', 'chromedriver'))
        const { locateChrome } = await import(pathToFileURL(requireFromUtils.resolve('locate-app')).href) as { locateChrome: () => Promise<string> }
        let chromeVersion: string | undefined
        try {
            chromeVersion = getBuildIdByChromePath(await locateChrome())
        } catch {
            chromeVersion = undefined
        }
        const chromedriver = (chromeVersion && downloaded.find((bin) => bin.includes(chromeVersion))) || downloaded[0]
        expect(chromedriver, 'chromedriver downloaded by the tests above').toBeDefined()
        const port = 9515 + Math.floor(Math.random() * 1000)
        const driver = spawn(chromedriver, [`--port=${port}`], { stdio: 'ignore' })
        try {
            await waitFor(() => new Promise((resolve) => {
                const socket = net.createConnection(port, '127.0.0.1')
                socket.on('connect', () => socket.end(() => resolve(true)))
                socket.on('error', () => resolve(false))
            }))
            const open = await project.run(['open', 'chrome', url, '--hostname', '127.0.0.1', '--port', String(port)])
            expect(open.code, open.stderr).toBe(0)
            const { pid } = readState(project)
            expect(descendants(pid).some((p) => comm(p) === 'chromedriver')).toBe(false)
            expect(descendants(driver.pid!).some((p) => comm(p) === 'chrome')).toBe(true)
            expect((await project.run(['close'])).code).toBe(0)
            expect(await waitFor(() => !descendants(driver.pid!).some((p) => comm(p) === 'chrome'), 5_000)).toBe(true)
            expect(isAlive(driver.pid!)).toBe(true)
        } finally {
            driver.kill('SIGKILL')
        }
    }, 60_000)

    it('opens Firefox', async () => {
        project = createProject('lifecycle')
        const open = await project.run(['open', 'firefox', url], { timeout: 300_000 })
        expect(open.code, open.stderr + open.stdout).toBe(0)
        const info = await project.run(['info', '--json'])
        expect(info.json.result.data).toMatchObject({ browserName: 'firefox', bidi: true, title: 'Session Fixture' })
    }, 320_000)
})
