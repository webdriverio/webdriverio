import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildPlan } from '../../src/targets/index.js'

const ctx = {
    name: 'default',
    cwd: '/repo',
    runtimeDir: '/run',
    artifactsDir: '/artifacts',
    argv: ['open'],
    env: {} as NodeJS.ProcessEnv,
    platform: 'linux' as const
}

const env = {
    BROWSERSTACK_USERNAME: 'bs-user',
    BROWSERSTACK_ACCESS_KEY: 'bs-key',
    SAUCE_USERNAME: 'sauce-user',
    SAUCE_ACCESS_KEY: 'sauce-key',
    TESTINGBOT_KEY: 'tb-key',
    TESTINGBOT_SECRET: 'tb-secret',
    LT_USERNAME: 'lt-user',
    LT_ACCESS_KEY: 'lt-key'
}

function plan (args: Record<string, unknown>, extraEnv: NodeJS.ProcessEnv = env) {
    return buildPlan(args as { target: string }, { ...ctx, env: extraEnv })
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('cloud providers', () => {
    it('builds a hub, options and labels for each provider', async () => {
        const browserstack = await plan({ target: 'chrome', provider: 'browserstack', os: 'Windows', osVersion: '11', project: 'wdio', build: '42', name: 'home' })
        expect(browserstack.remote).toMatchObject({ protocol: 'https', hostname: 'hub.browserstack.com', port: 443, path: '/wd/hub', user: 'bs-user', key: 'bs-key' })
        expect(browserstack.capabilities).toMatchObject({
            'bstack:options': {
                userName: 'bs-user',
                accessKey: 'bs-key',
                os: 'Windows',
                osVersion: '11',
                projectName: 'wdio',
                buildName: '42',
                sessionName: 'home'
            }
        })
        expect(browserstack.label).toBe('chrome (BrowserStack)')
        expect(browserstack.capabilities).not.toHaveProperty('goog:chromeOptions')
        expect(browserstack.bidi).toBe(false)

        const sauce = await plan({ target: 'chrome', provider: 'saucelabs', region: 'eu-central-1', name: 'home', build: '42', tunnel: 'external', tunnelName: 'ci' })
        expect(sauce.remote.hostname).toBe('ondemand.eu-central-1.saucelabs.com')
        expect(sauce.capabilities).toMatchObject({ 'sauce:options': { username: 'sauce-user', accessKey: 'sauce-key', name: 'home', build: '42', tunnelName: 'ci' } })
        expect(sauce.label).toContain('Sauce Labs')

        const us = await plan({ target: 'chrome', provider: 'saucelabs' })
        expect(us.remote.hostname).toBe('ondemand.us-west-1.saucelabs.com')
        const apac = await plan({ target: 'chrome', provider: 'saucelabs', region: 'apac-southeast-1' })
        expect(apac.remote.hostname).toBe('ondemand.apac-southeast-1.saucelabs.com')

        const testingbot = await plan({ target: 'chrome', provider: 'testingbot', name: 'home', build: '42' })
        expect(testingbot.remote).toMatchObject({ hostname: 'hub.testingbot.com', path: '/wd/hub', user: 'tb-key', key: 'tb-secret' })
        expect(testingbot.capabilities).toMatchObject({ 'tb:options': { key: 'tb-key', secret: 'tb-secret', name: 'home', build: '42' } })

        const browsers = await plan({ target: 'chrome', provider: 'testmu', os: 'Windows', osVersion: '11' })
        expect(browsers.remote.hostname).toBe('hub.lambdatest.com')
        expect(browsers.capabilities).toMatchObject({ 'LT:Options': { user: 'lt-user', accessKey: 'lt-key', platformName: 'Windows 11', w3c: true } })

        const apps = await plan({ target: 'android', provider: 'testmu', package: 'com.example', device: 'Pixel 8' })
        expect(apps.remote.hostname).toBe('mobile-hub.lambdatest.com')
        expect(apps.capabilities).toMatchObject({ 'LT:Options': { deviceName: 'Pixel 8', isRealMobile: true } })
    })

    it('keeps an explicit hostname and names missing credentials', async () => {
        const overridden = await plan({ target: 'chrome', provider: 'browserstack', hostname: '127.0.0.1', port: 4321 })
        expect(overridden.remote).toMatchObject({ hostname: '127.0.0.1', port: 4321, user: 'bs-user', key: 'bs-key' })
        expect(overridden.remote.path).toBeUndefined()

        await expect(plan({ target: 'chrome', provider: 'browserstack' }, {})).rejects.toMatchObject({
            code: 'MISSING_CREDENTIALS',
            message: expect.stringContaining('BROWSERSTACK_USERNAME')
        })
        await expect(plan({ target: 'chrome', provider: 'saucelabs' }, { SAUCE_USERNAME: 'only-user' })).rejects.toMatchObject({
            code: 'MISSING_CREDENTIALS',
            message: expect.stringContaining('SAUCE_ACCESS_KEY')
        })
        await expect(plan({ target: 'chrome', provider: 'saucelabs', region: 'moon' })).rejects.toMatchObject({ code: 'USAGE' })
    })

    it('records tunnel flags and requires browserstack-local when starting one', async () => {
        const external = await plan({ target: 'chrome', provider: 'browserstack', tunnel: 'external', tunnelName: 'ci' })
        expect(external.capabilities).toMatchObject({ 'bstack:options': { local: true, localIdentifier: 'ci' } })
        expect(external.tunnel).toBeUndefined()

        await expect(plan({ target: 'chrome', provider: 'browserstack', tunnel: 'ci' })).rejects.toMatchObject({
            code: 'MISSING_DEPENDENCY',
            package: 'browserstack-local'
        })

        const sauce = await plan({ target: 'chrome', provider: 'saucelabs', tunnel: 'ci' })
        expect(sauce.capabilities).toMatchObject({ 'sauce:options': { tunnelName: 'ci' } })
        expect(sauce.notes.join('\n')).toContain('saucectl')
    })

    it('uploads a local app and rewrites the capability', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-cloud-'))
        const app = path.join(dir, 'app.apk')
        fs.writeFileSync(app, 'apk')
        const calls: { url: string, init: RequestInit }[] = []
        vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
            calls.push({ url: String(url), init })
            return new Response(JSON.stringify({ app_url: 'bs://uploaded' }), { status: 200 })
        })
        const uploaded = await plan({ target: 'android', provider: 'browserstack', app })
        expect(uploaded.capabilities).toMatchObject({ 'appium:app': 'bs://uploaded' })
        expect(calls[0].url).toBe('https://api-cloud.browserstack.com/app-automate/upload')
        expect(calls[0].init.method).toBe('POST')
        expect((calls[0].init.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from('bs-user:bs-key').toString('base64')}`)
        const form = calls[0].init.body as FormData
        expect(form.get('file')).toBeTruthy()

        calls.length = 0
        vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
            calls.push({ url: String(url), init })
            return new Response(JSON.stringify({ item: { id: 'file-1' } }), { status: 200 })
        })
        const sauce = await plan({ target: 'android', provider: 'saucelabs', region: 'us-west-1', app })
        expect(sauce.capabilities).toMatchObject({ 'appium:app': 'storage:file-1' })
        expect(calls[0].url).toBe('https://api.us-west-1.saucelabs.com/v1/storage/upload')
        expect((calls[0].init.body as FormData).get('payload')).toBeTruthy()
        expect((calls[0].init.body as FormData).get('name')).toBe('app.apk')

        calls.length = 0
        vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
            calls.push({ url: String(url), init })
            return new Response(JSON.stringify({ app_url: 'lt://APP1' }), { status: 200 })
        })
        const testmu = await plan({ target: 'android', provider: 'testmu', app })
        expect(testmu.capabilities).toMatchObject({ 'appium:app': 'lt://APP1' })
        expect(calls[0].url).toBe('https://manual-api.lambdatest.com/app/upload/realDevice')
        expect((calls[0].init.body as FormData).get('appFile')).toBeTruthy()

        calls.length = 0
        vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
            calls.push({ url: String(url), init })
            return new Response(JSON.stringify({ app_url: 'tb://1' }), { status: 200 })
        })
        const tb = await plan({ target: 'android', provider: 'testingbot', app })
        expect(tb.capabilities).toMatchObject({ 'appium:app': 'tb://1' })
        expect((calls[0].init.body as FormData).get('file')).toBeTruthy()
        fs.rmSync(dir, { recursive: true, force: true })
    })
})
