/// <reference path="../../src/index.ts" />
import path from 'node:path'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

import { PolyfillManager } from '../../src/session/polyfill.js'
import {
    // @ts-expect-error mock
    instances,
    type SessionManager
} from '../../src/session/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('../../src/session/session.js', () => {
    const instances: SessionManager[] = []
    return {
        instances,
        SessionManager: class SessionManagerMock {
            removeListeners = vi.fn()
            isEnabled: () => boolean

            constructor(public browser, public name) {
                instances.push(this as unknown as SessionManager)

                /**
                 * set isEnabled to whatever is set in the browser
                 */
                this.isEnabled = () => browser.isEnabled()
            }
        }
    }
})

let browser: WebdriverIO.Browser & { on: Mock }

describe('PolyfillManager', () => {
    beforeEach(() => {
        browser = {
            on: vi.fn(),
            sessionSubscribe: vi.fn(),
            addInitScript: vi.fn(),
            execute: vi.fn(),
            isEnabled: vi.fn().mockReturnValue(true),
            options: { automationProtocol: 'webdriver' }
        } as unknown as WebdriverIO.Browser & { on: Mock }
    })

    it('should not do anything in non Bidi sessions', async () => {
        // @ts-expect-error mock
        browser.isEnabled = () => false
        const manager = new PolyfillManager(browser)
        expect(browser.on).toBeCalledTimes(0)
        expect(browser.sessionSubscribe).toBeCalledTimes(0)
        expect(browser.addInitScript).toBeCalledTimes(0)
        expect(instances[0].name).toBe('PolyfillManager')
        expect(await manager.initialize()).toBe(true)
    })

    it('should register all eventhandlers and scripts', async () => {
        const manager = new PolyfillManager(browser)
        expect(browser.on).toBeCalledTimes(1)
        expect(browser.sessionSubscribe).toBeCalledTimes(1)
        expect(browser.addInitScript).toBeCalledTimes(1)
        expect(browser.execute).toBeCalledTimes(1)
        expect(await manager.initialize()).toBe(true)
    })

    it('should register scripts when context is created', async () => {
        const manager = new PolyfillManager(browser)
        expect(browser.on.mock.calls[0][0]).toBe('browsingContext.contextCreated')
        browser.on.mock.calls[0][1]()
        expect(browser.addInitScript).toBeCalledTimes(2)
        expect(browser.execute).toBeCalledTimes(2)
        expect(await manager.initialize()).toBe(true)
    })
})
