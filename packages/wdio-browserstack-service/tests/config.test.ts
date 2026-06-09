import { describe, expect, it, vi, beforeEach } from 'vitest'
import BrowserStackConfig from '../src/config.js'

vi.mock('uuid', () => ({ v4: () => 'test-uuid' }))

const baseOptions = {} as any
const baseConfig = { framework: 'mocha', user: 'u', key: 'k' } as any

describe('BrowserStackConfig appAutomate detection', () => {
    beforeEach(() => {
        ;(BrowserStackConfig as any)._instance = undefined
    })

    it('marks app_automate when options.app is set (existing behaviour)', () => {
        const cfg = new BrowserStackConfig({ app: 'bs://abc' } as any, baseConfig)
        expect(cfg.appAutomate).toBe(true)
        expect(cfg.automate).toBe(false)
    })

    it('marks automate for web-only caps with no options.app', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            { browserName: 'chrome' },
        ] as any)
        expect(cfg.appAutomate).toBe(false)
        expect(cfg.automate).toBe(true)
    })

    it('marks app_automate when capabilities carry appium:app', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            { platformName: 'iOS', 'appium:app': 'bs://xyz' },
        ] as any)
        expect(cfg.appAutomate).toBe(true)
        expect(cfg.automate).toBe(false)
    })

    it('marks app_automate for the nested appium:options.app form', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            { 'appium:options': { app: 'bs://abc' } },
        ] as any)
        expect(cfg.appAutomate).toBe(true)
    })

    it('marks app_automate when only a W3C firstMatch entry carries the app cap', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            { alwaysMatch: { platformName: 'iOS' }, firstMatch: [{ 'appium:app': 'bs://abc' }] },
        ] as any)
        expect(cfg.appAutomate).toBe(true)
    })

    it('marks app_automate for multiremote (object form) with an app cap', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, {
            phone: { capabilities: { 'appium:bundleId': 'com.example' } },
            browser: { capabilities: { browserName: 'chrome' } },
        } as any)
        expect(cfg.appAutomate).toBe(true)
    })
})

describe('BrowserStackConfig isBrowserStackInfra gating', () => {
    beforeEach(() => {
        ;(BrowserStackConfig as any)._instance = undefined
    })

    it('marks neither automate nor app_automate for a web run on an external (non-BrowserStack) grid', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            { browserName: 'chrome' },
        ] as any, false)
        expect(cfg.automate).toBe(false)
        expect(cfg.appAutomate).toBe(false)
    })

    it('does not mark app_automate from app caps when not on BrowserStack infra', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            { platformName: 'iOS', 'appium:app': 'bs://xyz' },
        ] as any, false)
        expect(cfg.appAutomate).toBe(false)
        expect(cfg.automate).toBe(false)
    })

    it('keeps automate true for a web run on BrowserStack infra', () => {
        const cfg = new BrowserStackConfig(baseOptions, baseConfig, [
            { browserName: 'chrome' },
        ] as any, true)
        expect(cfg.automate).toBe(true)
        expect(cfg.appAutomate).toBe(false)
    })
})
