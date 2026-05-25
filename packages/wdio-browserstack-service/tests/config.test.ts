import { describe, expect, it, vi, beforeEach } from 'vitest'
import BrowserStackConfig from '../src/config.js'

vi.mock('uuid', () => ({ v4: () => 'test-uuid' }))

const baseOptions = {} as any
const baseConfig = { framework: 'mocha', user: 'u', key: 'k' } as any

describe('BrowserStackConfig appAutomate detection', () => {
    beforeEach(() => {
        // reset singleton so each test gets a fresh instance
        ;(BrowserStackConfig as any)._instance = undefined
    })

    it('treats web-only caps with no `app` option as automate', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            { browserName: 'chrome' },
        ] as any)
        expect(cfg.appAutomate).toBe(false)
        expect(cfg.automate).toBe(true)
    })

    it('marks app_automate when options.app is set, even without caps', () => {
        const cfg = new BrowserStackConfig({ app: 'bs://abc' } as any, baseConfig)
        expect(cfg.appAutomate).toBe(true)
        expect(cfg.automate).toBe(false)
    })

    it('marks app_automate when capabilities carry appium:app', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            { platformName: 'iOS', 'appium:app': 'bs://xyz' },
        ] as any)
        expect(cfg.appAutomate).toBe(true)
        expect(cfg.automate).toBe(false)
    })

    it('marks app_automate when capabilities carry appium:bundleId', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            { platformName: 'iOS', 'appium:bundleId': 'com.example.app' },
        ] as any)
        expect(cfg.appAutomate).toBe(true)
        expect(cfg.automate).toBe(false)
    })

    it('marks app_automate for android caps with appPackage', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            { platformName: 'Android', 'appium:appPackage': 'com.example' },
        ] as any)
        expect(cfg.appAutomate).toBe(true)
    })

    it('marks app_automate for parallel multiremote with one app cap', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            {
                phone: { capabilities: { 'appium:app': 'bs://abc' } },
                browser: { capabilities: { browserName: 'chrome' } },
            },
        ] as any)
        expect(cfg.appAutomate).toBe(true)
    })

    it('marks app_automate for regular multiremote (object) with an app cap', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, {
            phone: { capabilities: { 'appium:bundleId': 'com.example' } },
            browser: { capabilities: { browserName: 'chrome' } },
        } as any)
        expect(cfg.appAutomate).toBe(true)
    })

    it('marks app_automate when alwaysMatch carries an app cap', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            { alwaysMatch: { 'appium:app': 'bs://abc' }, firstMatch: [] },
        ] as any)
        expect(cfg.appAutomate).toBe(true)
    })

    it('marks app_automate when only a W3C firstMatch entry carries an app cap', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            {
                alwaysMatch: { platformName: 'iOS' },
                firstMatch: [{ 'appium:app': 'bs://abc' }],
            },
        ] as any)
        expect(cfg.appAutomate).toBe(true)
    })

    it('marks app_automate when caps use nested appium:options.app', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            { platformName: 'iOS', 'appium:options': { app: 'bs://abc' } },
        ] as any)
        expect(cfg.appAutomate).toBe(true)
    })

    it('still marks automate when capabilities omit any app signal', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            { browserName: 'chrome' },
            { browserName: 'firefox' },
        ] as any)
        expect(cfg.appAutomate).toBe(false)
        expect(cfg.automate).toBe(true)
    })

    it('falls back to options-only behavior when capabilities are omitted', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig)
        expect(cfg.appAutomate).toBe(false)
        expect(cfg.automate).toBe(true)
    })
})
