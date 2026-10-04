import { describe, it, expect } from 'vitest'

import { browserPlan } from '../../src/targets/browser.js'
import { buildPlan } from '../../src/targets/index.js'

const ctx = { name: 'default', cwd: '/repo', runtimeDir: '/run', artifactsDir: '/repo/.wdio/session/default', argv: ['open', 'chrome'], env: {}, platform: 'linux' as const }

describe('browser targets', () => {
    it('builds headless Chrome capabilities with BiDi', () => {
        const plan = browserPlan('chrome', { target: 'chrome' }, { cwd: '/repo', platform: 'linux', env: {} })
        expect(plan.capabilities).toEqual({
            browserName: 'chrome',
            webSocketUrl: true,
            pageLoadStrategy: 'eager',
            'goog:chromeOptions': { args: ['--headless=new', '--enable-unsafe-swiftshader', '--window-size=1280,720'] }
        })
        expect(plan).toMatchObject({ headless: true, display: false, detach: false, viewport: { width: 1280, height: 720 } })
    })

    it('builds Edge capabilities with profile, binary and extra args', () => {
        const plan = browserPlan('edge', { target: 'edge', profile: 'p', binary: 'bin/edge', arg: ['--lang=de'], viewport: '800x600', browserVersion: '130' }, { cwd: '/repo', platform: 'linux', env: {} })
        expect(plan.capabilities).toEqual({
            browserName: 'MicrosoftEdge',
            webSocketUrl: true,
            pageLoadStrategy: 'eager',
            browserVersion: '130',
            'ms:edgeOptions': {
                args: ['--headless=new', '--enable-unsafe-swiftshader', '--window-size=800,600', '--user-data-dir=/repo/p', '--lang=de'],
                binary: '/repo/bin/edge'
            }
        })
    })

    it('builds Firefox capabilities', () => {
        const plan = browserPlan('firefox', { target: 'firefox', headed: true }, { cwd: '/repo', platform: 'linux', env: { DISPLAY: ':0' } })
        expect(plan.capabilities).toEqual({ browserName: 'firefox', webSocketUrl: true, pageLoadStrategy: 'eager', 'moz:firefoxOptions': { args: ['--width=1280', '--height=720'] } })
        expect(plan.display).toBe(false)
    })

    it('accepts --headless, the default, even with --headed or WDIO_SESSION_HEADED set', () => {
        expect(browserPlan('chrome', { target: 'chrome', headless: true }, { cwd: '/', platform: 'linux', env: {} }).headless).toBe(true)
        expect(browserPlan('chrome', { target: 'chrome', headless: true, headed: true }, { cwd: '/', platform: 'linux', env: {} }).headless).toBe(true)
        expect(browserPlan('chrome', { target: 'chrome', headless: true }, { cwd: '/', platform: 'linux', env: { WDIO_SESSION_HEADED: '1' } }).headless).toBe(true)
    })

    it('starts a virtual display for headed sessions on Linux without DISPLAY', () => {
        expect(browserPlan('chrome', { target: 'chrome' }, { cwd: '/', platform: 'linux', env: { WDIO_SESSION_HEADED: '1' } }).display).toBe(true)
        expect(browserPlan('chrome', { target: 'chrome', headed: true }, { cwd: '/', platform: 'darwin', env: {} }).display).toBe(false)
    })

    it('attaches to a running Chrome and detaches on close', () => {
        const plan = browserPlan('chrome', { target: 'chrome', attach: '9222' }, { cwd: '/', platform: 'linux', env: { DISPLAY: ':0' } })
        expect(plan.capabilities).toMatchObject({ 'goog:chromeOptions': { debuggerAddress: 'localhost:9222' } })
        expect(plan).toMatchObject({ detach: true, headless: false, viewport: undefined })
        expect(browserPlan('edge', { target: 'edge', attach: 'http://host:9333/' }, { cwd: '/', platform: 'linux', env: { DISPLAY: ':0' } }).capabilities)
            .toMatchObject({ 'ms:edgeOptions': { debuggerAddress: 'host:9333' } })
        expect(() => browserPlan('firefox', { target: 'firefox', attach: '9222' }, { cwd: '/', platform: 'linux', env: {} })).toThrow(expect.objectContaining({ code: 'USAGE' }))
    })

    it('requires macOS for Safari and opens it headed', () => {
        expect(() => browserPlan('safari', { target: 'safari' }, { cwd: '/', platform: 'linux', env: {} })).toThrow(expect.objectContaining({ code: 'NOT_SUPPORTED' }))
        const plan = browserPlan('safari', { target: 'safari' }, { cwd: '/', platform: 'darwin', env: {} })
        expect(plan).toMatchObject({ headless: false, capabilities: { browserName: 'safari', webSocketUrl: false } })
        expect(plan.notes).toEqual(['Safari has no headless mode, opening a visible window.'])
    })

    it('buildPlan passes remote endpoint flags, --no-bidi and --capabilities', async () => {
        const plan = await buildPlan({
            target: 'chrome', url: 'http://localhost:3000', hostname: 'grid.local', port: 4444, path: '/wd/hub', protocol: 'https',
            bidi: false, capabilities: '{"goog:chromeOptions":{"mobileEmulation":{"deviceName":"Pixel 7"}}}', idleTimeout: '5m'
        }, ctx)
        expect(plan.remote).toEqual({ logLevel: 'warn', hostname: 'grid.local', port: 4444, path: '/wd/hub', protocol: 'https' })
        expect(plan.capabilities).toMatchObject({
            webSocketUrl: false,
            'goog:chromeOptions': { args: expect.any(Array), mobileEmulation: { deviceName: 'Pixel 7' } }
        })
        expect(plan).toMatchObject({ url: 'http://localhost:3000', bidi: false, idleTimeout: 300_000, launchTimeout: 180_000 })
    })

    it('buildPlan rejects unknown targets', async () => {
        await expect(buildPlan({ target: 'netscape' }, ctx)).rejects.toMatchObject({ code: 'USAGE', message: 'Unknown target "netscape".' })
    })
})
