import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, waitFor, type FixtureServer, type Project } from './helpers.js'

describe('wdio session logs and network', () => {
    let server: FixtureServer
    let project: Project

    const run = async (...args: string[]) => {
        const res = await project.run(args)
        expect(res.code, `${args.join(' ')}\n${res.stderr}`).toBe(0)
        return res
    }
    const until = async (read: () => Promise<string>, includes: string) => {
        let last = ''
        const found = await waitFor(async () => {
            last = await read()
            return last.includes(includes)
        }, 8_000)
        expect(found, last).toBe(true)
        return last
    }

    beforeAll(async () => {
        server = await startServer()
        project = createProject('network')
        await run('open', 'chrome', `${server.url}/network.html`)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('prints console errors once unless peeked', async () => {
        await run('click', '#log-error')
        const first = await until(async () => (await run('logs', '--errors', '--peek')).stdout, 'boom')
        expect(first).toMatch(/error\s+console\s+boom/)
        expect((await run('logs', '--errors', '--peek')).stdout).toContain('boom')
        expect((await run('logs', '--errors')).stdout).toContain('boom')
        expect((await run('logs', '--errors')).stdout).not.toContain('boom')
    })

    it('records an uncaught exception as a page error', async () => {
        await run('click', '#throw')
        const text = await until(async () => (await run('logs', '--errors', '--peek')).stdout, 'kaboom')
        expect(text).toMatch(/error\s+page\s+.*kaboom/)
        await run('logs', '--errors')
    })

    it('lists failed requests and filtered successful ones', async () => {
        await run('click', '#fail')
        const failed = await until(async () => (await run('requests', '--failed')).stdout, '127.0.0.1:9')
        expect(failed).toMatch(/ERR GET http:\/\/127\.0\.0\.1:9\/nothing/)

        await run('click', '#load')
        const ok = await until(async () => (await run('requests', '--filter', '/api/user')).stdout, '/api/user')
        expect(ok).toMatch(/200 GET http:\/\/.*\/api\/user/)
        await until(async () => (await run('exec', '-e', 'await $("#name").getText()')).stdout, 'Real User')
    })

    it('mocks a response, restores it, responds once and aborts', async () => {
        const mocked = await run('mock', '**/api/user', '--body', '{"name":"Mocked"}')
        expect(mocked.stdout).toBe('Mocked **/api/user (id m1)\n→ const m1 = await browser.mock(\'**/api/user\')\nm1.respond({"name":"Mocked"}, { statusCode: 200 })\n')
        const name = async () => (await run('exec', '-e', 'await $("#name").getText()')).stdout.trim()
        await run('click', '#load')
        expect(await until(name, 'Mocked')).toBe('Mocked')

        expect((await run('unmock', '--all')).stdout).toContain('Removed 1 mock')
        await run('click', '#load')
        expect(await until(name, 'Real User')).toBe('Real User')

        await run('mock', '**/api/user', '--status', '500', '--once')
        await run('click', '#load')
        expect(await until(name, 'HTTP 500')).toBe('Error: HTTP 500')
        await run('click', '#load')
        expect(await until(name, 'Real User')).toBe('Real User')

        await run('unmock', '--all')
        await run('mock', '**/api/user', '--abort')
        await run('click', '#load')
        expect(await until(name, 'Error:')).toMatch(/^Error: /)
    })

    it('requires BiDi for mocks', async () => {
        await run('open', 'chrome', `${server.url}/network.html`, '--no-bidi', '-s', 'classic')
        const res = await project.run(['-s', 'classic', 'mock', '**/api/user', '--body', '{}', '--json'])
        expect(res.code).toBe(1)
        expect(res.json.error.code).toBe('BIDI_REQUIRED')
    })
})
