import { describe, it, expect } from 'vitest'

import { buildPlan } from '../../src/targets/index.js'

const ctx = {
    name: 'default',
    cwd: '/repo',
    runtimeDir: '/run',
    artifactsDir: '/repo/.wdio/session/default',
    argv: ['open', 'android'],
    env: {} as NodeJS.ProcessEnv,
    platform: 'linux' as const
}

describe('mobile targets', () => {
    it('builds Android capabilities for an app, an installed package and mobile web', async () => {
        const app = await buildPlan({ target: 'android', appiumUrl: 'http://127.0.0.1:4723/', app: 'https://example.com/app.apk', device: 'Pixel', platformVersion: '14', orientation: 'portrait', fullReset: true }, ctx)
        expect(app.capabilities).toMatchObject({
            platformName: 'Android',
            'appium:automationName': 'UiAutomator2',
            'appium:deviceName': 'Pixel',
            'appium:platformVersion': '14',
            'appium:app': 'https://example.com/app.apk',
            'appium:autoGrantPermissions': true,
            'appium:newCommandTimeout': 3600,
            'appium:orientation': 'PORTRAIT',
            'appium:fullReset': true
        })
        expect(app).toMatchObject({ platform: 'mobile', applies: ['M'], label: 'android (UiAutomator2)', remote: { hostname: '127.0.0.1', port: 4723, path: '/' } })
        expect(app.appium?.main).toBeUndefined()

        const installed = await buildPlan({ target: 'android', appiumUrl: 'http://localhost:4723', package: 'com.example', activity: '.Main', reset: false }, ctx)
        expect(installed.capabilities).toMatchObject({ 'appium:appPackage': 'com.example', 'appium:appActivity': '.Main', 'appium:noReset': true })

        const web = await buildPlan({ target: 'android', appiumUrl: 'http://localhost:4723/', browser: 'chrome' }, ctx)
        expect(web.capabilities).toMatchObject({ browserName: 'chrome' })
        expect(web.applies).toEqual(['W'])

        const uploaded = await buildPlan({ target: 'android', appiumUrl: 'http://127.0.0.1:4723/', app: 'bs://uploaded' }, ctx)
        expect(uploaded.capabilities).toMatchObject({ 'appium:app': 'bs://uploaded' })
    })

    it('builds iOS capabilities', async () => {
        const plan = await buildPlan({ target: 'ios', appiumUrl: 'http://localhost:4723/', bundleId: 'com.example.app', udid: 'abc' }, ctx)
        expect(plan.capabilities).toMatchObject({
            platformName: 'iOS',
            'appium:automationName': 'XCUITest',
            'appium:deviceName': 'iPhone 16',
            'appium:bundleId': 'com.example.app',
            'appium:udid': 'abc',
            'appium:autoAcceptAlerts': false
        })
    })

    it('requires an app, package or browser', async () => {
        await expect(buildPlan({ target: 'android', appiumUrl: 'http://localhost:4723/' }, ctx)).rejects.toMatchObject({ code: 'USAGE' })
        await expect(buildPlan({ target: 'ios', appiumUrl: 'http://localhost:4723/' }, ctx)).rejects.toMatchObject({ code: 'USAGE' })
    })
})
