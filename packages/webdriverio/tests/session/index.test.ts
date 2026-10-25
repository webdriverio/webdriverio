import { describe, it, expect, vi } from 'vitest'

import { getPolyfillManager } from '../../src/session/polyfill.js'
import { getShadowRootManager } from '../../src/session/shadowRoot.js'
import { getNetworkManager } from '../../src/session/networkManager.js'
import { getDialogManager } from '../../src/session/dialog.js'
import { getContextManager } from '../../src/session/context.js'
import { getBidiMapperLogManager } from '../../src/session/bidiMapperLog.js'
import { registerSessionManager } from '../../src/session/index.js'
import { setIOSScriptTimeout, trackScriptTimeout } from '../../src/utils/scriptTimeout.js'

vi.mock('../../src/session/polyfill.js', () => ({
    getPolyfillManager: vi.fn(() => ({ initialize: vi.fn() }))
}))
vi.mock('../../src/session/shadowRoot.js', () => ({
    getShadowRootManager: vi.fn(() => ({ initialize: vi.fn() }))
}))
vi.mock('../../src/session/networkManager.js', () => ({
    getNetworkManager: vi.fn(() => ({ initialize: vi.fn() }))
}))
vi.mock('../../src/session/dialog.js', () => ({
    getDialogManager: vi.fn(() => ({ initialize: vi.fn() }))
}))
vi.mock('../../src/session/bidiMapperLog.js', () => ({
    getBidiMapperLogManager: vi.fn(() => ({ initialize: vi.fn() }))
}))
vi.mock('../../src/session/context.js', () => ({
    getContextManager: vi.fn(() => ({ initialize: vi.fn() }))
}))
vi.mock('../../src/utils/scriptTimeout.js', () => ({
    trackScriptTimeout: vi.fn(),
    setIOSScriptTimeout: vi.fn()
}))

describe('webdriverio session manager', () => {
    it('registers all session manager', async () => {
        const browser = {
            capabilities: {
                webSocketUrl: 'ws://foobar'
            }
        } as unknown as WebdriverIO.Browser
        registerSessionManager(browser)
        expect(getPolyfillManager).toBeCalledWith(browser)
        expect(getShadowRootManager).toBeCalledWith(browser)
        expect(getNetworkManager).toBeCalledWith(browser)
        expect(getDialogManager).toBeCalledWith(browser)
        expect(getBidiMapperLogManager).toBeCalledWith(browser)
        expect(getContextManager).toBeCalledWith(browser)
        expect(trackScriptTimeout).toBeCalledWith(browser)
        expect(setIOSScriptTimeout).toBeCalledWith(browser)
    })

    it('does not register for protocol stub', async () => {
        const browser = {
            capabilities: {}
        } as unknown as WebdriverIO.Browser
        registerSessionManager(browser)
        expect(getPolyfillManager).not.toBeCalledWith(browser)
        expect(getShadowRootManager).not.toBeCalledWith(browser)
        expect(getNetworkManager).not.toBeCalledWith(browser)
        expect(getDialogManager).not.toBeCalledWith(browser)
        expect(getBidiMapperLogManager).not.toBeCalledWith(browser)
        expect(trackScriptTimeout).not.toBeCalledWith(browser)
        // ContextManager is always registered for caching current window handle
        expect(getContextManager).toBeCalledWith(browser)
    })
})
