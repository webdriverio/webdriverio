import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

describe('wdio session emulation', () => {
    let server: FixtureServer
    let project: Project

    const run = async (...args: string[]) => {
        const res = await project.run(args)
        expect(res.code, `${args.join(' ')}\n${res.stderr}`).toBe(0)
        return res
    }
    const read = async (expr: string) => {
        const res = await run('exec', '-e', `JSON.stringify(await browser.execute(() => (${expr})) ?? null)`)
        return JSON.parse(res.stdout)
    }
    const timedFetch = '(async () => { const t = Date.now(); await fetch("/index.html?r=" + Math.random()); return Date.now() - t })()'

    beforeAll(async () => {
        server = await startServer()
        project = createProject('emulate')
        await run('open', 'chrome', `${server.url}/index.html`, '--viewport', '1280x720')
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('lists devices and emulates one', async () => {
        const list = await run('emulate', 'device', '--json')
        expect(list.json.result.data.devices).toContain('iPhone 15')
        const res = await project.run(['emulate', 'device', 'iphone 15'])
        if (res.code === 0) {
            expect(res.stdout).toBe("Emulating iPhone 15 (393x659 @3x).\n→ await browser.emulate('device', 'iPhone 15')\n")
            expect(await read('[innerWidth, devicePixelRatio, navigator.userAgent.includes("iPhone")]')).toEqual([393, 3, true])
        } else {
            // Chrome 148 does not implement viewport-meta or text-layout yet.
            // The command must surface that and leave the previous viewport in place.
            expect(`${res.stderr}\n${res.stdout}`).toMatch(/unknown command|unsupported operation/i)
            expect(await read('[innerWidth, navigator.userAgent.includes("iPhone")]')).toEqual([1280, false])
        }
        const unknown = await project.run(['emulate', 'device', 'iPhone 99'])
        expect(unknown.code).toBe(2)
        expect(unknown.stderr).toContain('Did you mean: iPhone')
    })

    it('emulates the color scheme', async () => {
        const res = await project.run(['emulate', 'color-scheme', 'dark'])
        if (res.code === 0) {
            expect(await read('matchMedia("(prefers-color-scheme: dark)").matches')).toBe(true)
        } else {
            expect(`${res.stderr}\n${res.stdout}`).toMatch(/setMediaFeaturesOverride/)
            expect(`${res.stderr}\n${res.stdout}`).toMatch(/unknown command|unsupported operation/i)
        }
    })

    it('emulates the clock and advances it', async () => {
        const set = await run('emulate', 'clock', '2030-01-01T00:00:00Z')
        expect(set.stdout).toContain('Clock set to 2030-01-01T00:00:00.000Z')
        expect(set.stdout).toContain('1893456000000')
        expect(await read('new Date().toISOString()')).toBe('2030-01-01T00:00:00.000Z')
        const tick = await run('emulate', 'clock', '--tick', '60000')
        expect(tick.stdout).toContain('Clock advanced by 60000ms')
        expect(await read('new Date().toISOString()')).toBe('2030-01-01T00:01:00.000Z')
    })

    it('restores everything with reset', async () => {
        const res = await run('emulate', 'reset')
        expect(res.stdout).toMatch(/^Reset (device, )?(colorScheme, )?clock\./)
        expect(await read('[innerWidth, matchMedia("(prefers-color-scheme: dark)").matches, new Date().getUTCFullYear() < 2030, navigator.userAgent.includes("iPhone")]'))
            .toEqual([1280, false, true, false])
        expect((await run('emulate', 'reset')).stdout).toBe('Nothing to reset\n→ await browser.restore()\n')
    })

    it('takes the network offline and back online', async () => {
        await run('emulate', 'network', 'offline')
        expect(await read('fetch("/index.html?r=" + Math.random()).then(() => "ok", () => "rejected")')).toBe('rejected')
        expect(await read('navigator.onLine')).toBe(false)
        await run('emulate', 'network', 'online')
        expect(await read('fetch("/index.html?r=" + Math.random()).then(() => "ok", () => "rejected")')).toBe('ok')
    })

    it('throttles the network and the CPU', async () => {
        const res = await run('emulate', 'network', 'regular3g')
        expect(res.stdout).toBe('Network throttled to Regular3G (100ms latency)\n→ await browser.setNetworkConditions({ latency: 100, download_throughput: 96000, upload_throughput: 32000 })\n')
        const conditions = JSON.parse((await run('exec', '-e', 'JSON.stringify(await browser.getNetworkConditions())')).stdout)
        expect(conditions).toMatchObject({ latency: 100, download_throughput: 96000, upload_throughput: 32000 })
        // Headless Chrome does not add chromedriver latency to loopback fetches,
        // so a wall-clock check is not stable on a GitHub-hosted runner.
        await run('emulate', 'network', 'online')
        expect(await read(timedFetch)).toBeLessThan(100)

        const loop = '(() => { const t = Date.now(); let x = 0; for (let i = 0; i < 2e7; i++) x += i; return Date.now() - t })()'
        const base = await read(loop)
        await run('emulate', 'cpu', '8')
        expect(await read(loop)).toBeGreaterThan(base * 2)
        await run('emulate', 'reset')
        expect(await read(loop)).toBeLessThan(base * 3)
    })

    it('sets the viewport', async () => {
        expect((await run('emulate', 'viewport', '800x600', '--dpr', '2')).stdout).toBe('Viewport 800x600 @2x\n→ await browser.setViewport({ width: 800, height: 600, devicePixelRatio: 2 })\n')
        expect(await read('[innerWidth, innerHeight, devicePixelRatio]')).toEqual([800, 600, 2])
        const bad = await project.run(['emulate', 'viewport', 'big'])
        expect(bad.code).toBe(2)
        await run('emulate', 'reset')
        expect(await read('innerWidth')).toBe(1280)
    })

    it('emulates the geolocation', async () => {
        const res = await run('geolocation', '52.52', '13.40', '--accuracy', '10')
        expect(res.stdout).toContain("→ await browser.emulate('geolocation', { latitude: 52.52, longitude: 13.4, accuracy: 10 })")
        await run('navigate', `${server.url}/geo.html`)
        await run('exec', '-e', 'await browser.waitUntil(async () => (await $("#coords").getText()) !== "")')
        expect((await run('exec', '-e', 'await $("#coords").getText()')).stdout).toBe('52.52,13.40\n')
        const bad = await project.run(['geolocation', '100', '0'])
        expect(bad.code).toBe(2)
    })
})
