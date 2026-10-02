import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { MAX_INLINE_OUTPUT, Workspace } from '../src/workspace.js'

type Tool = { name: string, invoke: (input: unknown) => Promise<unknown> }

async function tools (workspace: Workspace) {
    const middleware = await workspace.middleware() as unknown as { tools: Tool[] }
    return middleware.tools
}

async function call (workspace: Workspace, name: string, input: unknown) {
    const tool = (await tools(workspace)).find((t) => t.name === name)!
    return JSON.stringify(await tool.invoke(input))
}

describe('Workspace', () => {
    let root: string

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-ws-'))
        delete process.env.WDIO_WORKER_ID
    })

    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true })
    })

    it('puts every test in its own folder per worker and spec', () => {
        process.env.WDIO_WORKER_ID = '0-1'
        const workspace = new Workspace(root, '/project/test/cart.e2e.ts', 'cart › adds a "blue" shirt')
        expect(workspace.dir).toBe(path.join(root, '0-1', 'cart.e2e.ts', 'cart-adds-a-blue-shirt'))
        delete process.env.WDIO_WORKER_ID
    })

    it('numbers snapshots, writes events and steps, and redacts placeholder values', async () => {
        const workspace = new Workspace(root, 'cart.e2e.ts', 'login')
        workspace.values = { password: 's3cr3t' }
        expect(await workspace.writeSnapshot('- textbox "Password" value=s3cr3t')).toBe('/snapshots/001.txt')
        expect(await workspace.writeSnapshot('- button "Sign in"')).toBe('/snapshots/002.txt')
        await workspace.writeEvents(
            [{ seq: 1, time: 1, level: 'error', source: 'console', text: 'login failed for s3cr3t' }],
            [{ seq: 1, time: 1, method: 'POST', url: 'https://shop.example/api/login', status: 401, failed: false }]
        )
        await workspace.writeSteps([{ action: 'fill', args: { target: '#pw', text: '{{password}}' }, code: 'await $(\'#pw\').setValue(\'{{password}}\')' }])

        const read = (file: string) => fs.readFileSync(path.join(workspace.dir, file), 'utf-8')
        expect(read('snapshots/001.txt')).toBe('- textbox "Password" value={{password}}')
        expect(read('console.ndjson')).toBe('{"seq":1,"time":1,"level":"error","source":"console","text":"login failed for {{password}}"}')
        expect(JSON.parse(read('network.ndjson'))).toMatchObject({ method: 'POST', status: 401 })
        expect(JSON.parse(read('steps.json'))[0].code).toContain('{{password}}')
    })

    it('writes response bodies with an index, redacted, and skips bodies the browser no longer has', async () => {
        const workspace = new Workspace(root, 'cart.e2e.ts', 'responses')
        workspace.values = { token: 's3cr3t' }
        const responses = [
            { request: 'r1', method: 'GET', url: 'https://shop.example/api/cart?x=1', status: 200, mimeType: 'application/json' },
            { request: 'r2', method: 'POST', url: 'https://shop.example/api/gone', status: 201, mimeType: 'text/plain' },
            { request: 'r3', method: 'GET', url: 'https://shop.example/api/me', status: 200, mimeType: 'text/plain' }
        ]
        const bodies: Record<string, string | undefined> = { r1: '{"items":[{"sku":"blue-shirt"}]}', r3: 'token=s3cr3t' }
        const log = { responses, body: async (response: { request: string }) => bodies[response.request] }

        expect(await workspace.writeResponses(log as never)).toBe(2)
        const dir = path.join(workspace.dir, 'responses')
        expect(fs.readdirSync(dir).sort()).toEqual(['01-GET-api-cart.json', '03-GET-api-me.txt', 'index.ndjson'])
        expect(fs.readFileSync(path.join(dir, '03-GET-api-me.txt'), 'utf-8')).toBe('token={{token}}')
        expect(fs.readFileSync(path.join(dir, 'index.ndjson'), 'utf-8').split('\n').map((line) => JSON.parse(line))).toEqual([
            { file: '/responses/01-GET-api-cart.json', method: 'GET', url: 'https://shop.example/api/cart?x=1', status: 200, mimeType: 'application/json' },
            { file: '/responses/03-GET-api-me.txt', method: 'GET', url: 'https://shop.example/api/me', status: 200, mimeType: 'text/plain' }
        ])
    })

    it('moves long tool output to a file and returns a pointer with the first lines', async () => {
        const workspace = new Workspace(root, 'cart.e2e.ts', 'big page')
        expect(await workspace.inline('snapshot', 'short')).toBe('short')

        const long = 'x'.repeat(MAX_INLINE_OUTPUT + 1)
        const pointer = await workspace.inline('snapshot', long)
        expect(pointer.length).toBeLessThan(2200)
        expect(pointer).toContain(`[${long.length} characters, the full output is in /outputs/001-snapshot.txt`)
        expect(fs.readFileSync(path.join(workspace.dir, 'outputs', '001-snapshot.txt'), 'utf-8')).toBe(long)
    })

    it('offers read-only file tools confined to the folder', async () => {
        const workspace = new Workspace(root, 'cart.e2e.ts', 'tools')
        await workspace.writeEvents([{ seq: 1, time: 1, level: 'info', source: 'console', text: 'cart loaded' }], [])

        expect((await tools(workspace)).map((t) => t.name).sort()).toEqual(['glob', 'grep', 'ls', 'read_file'])
        expect(await call(workspace, 'read_file', { file_path: '/console.ndjson' })).toContain('cart loaded')
        expect(await call(workspace, 'grep', { pattern: 'cart loaded' })).toContain('console.ndjson')
        expect(await call(workspace, 'read_file', { file_path: '/../../etc/passwd' })).toContain('must not contain')
    })

    it('refuses to start when the folder contains a symbolic link', async () => {
        const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-outside-'))
        fs.writeFileSync(path.join(outside, 'secret.txt'), 'TOP SECRET')
        const workspace = new Workspace(root, 'cart.e2e.ts', 'symlink')
        fs.mkdirSync(path.join(workspace.dir, 'snapshots'), { recursive: true })
        fs.symlinkSync(path.join(outside, 'secret.txt'), path.join(workspace.dir, 'snapshots', 'leak.txt'))

        await expect(workspace.middleware()).rejects.toThrow('The workspace contains a symbolic link')
        fs.rmSync(outside, { recursive: true, force: true })
    })

    it('keeps the folder on failure or heal by default, always, or never', async () => {
        const make = (name: string) => {
            const workspace = new Workspace(root, 'cart.e2e.ts', name)
            fs.mkdirSync(workspace.dir, { recursive: true })
            return workspace
        }
        const passed = make('passed')
        expect(await passed.finish('on-failure', true)).toBe(false)
        expect(fs.existsSync(passed.dir)).toBe(false)

        const failed = make('failed')
        expect(await failed.finish('on-failure', false)).toBe(true)

        const healed = make('healed')
        healed.keep = true
        expect(await healed.finish('on-failure', true)).toBe(true)

        expect(await make('always').finish('always', true)).toBe(true)
        const never = make('never')
        never.keep = true
        expect(await never.finish('never', false)).toBe(false)
    })
})
