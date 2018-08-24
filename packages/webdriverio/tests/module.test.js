import { detectBackend } from 'wdio-config'

import { remote, multiremote } from '../src'

jest.mock('webdriver', () => {
    const client = {
        sessionId: 'foobar-123',
        addCommand: jest.fn()
    }
    const newSessionMock = jest.fn()
    newSessionMock.mockReturnValue(new Promise((resolve) => resolve(client)))
    newSessionMock.mockImplementation((params, cb) => cb ? cb(client, params) : params)

    return { newSession: newSessionMock, attachToSession: jest.fn() }
})

jest.mock('wdio-config', () => {
    const validateConfigMock = {
        validateConfig: jest.fn(),
        detectBackend: jest.fn()
    }
    return validateConfigMock
})

const WebDriver = require('webdriver')

describe('WebdriverIO module interface', () => {
    it('should provide remote and multiremote access', () => {
        expect(typeof remote).toBe('function')
        expect(typeof multiremote).toBe('function')
    })

    describe('remote function', () => {
        it('creates a webdriver session', async () => {
            const browser = await remote({ capabilities: {} })
            expect(browser.sessionId).toBe('foobar-123')
        })

        it('allows to propagate a modifier', async () => {
            const browser = await remote({ capabilities: {} }, (client) => {
                client.foobar = 'barfoo'
                return client
            })
            expect(browser.sessionId).toBe('foobar-123')
            expect(browser.foobar).toBe('barfoo')
        })

        it('should try to detect the backend', async () => {
            await remote({ user: 'foo', key: 'bar', capabilities: {} })
            expect(detectBackend).toBeCalled()
        })
    })

    describe('multiremote', () => {
        it('register multiple clients', async () => {
            await multiremote({
                browserA: { browserName: 'chrome' },
                browserB: { browserName: 'firefox' }
            })
            expect(WebDriver.attachToSession).toBeCalled()
            expect(WebDriver.newSession.mock.calls).toHaveLength(2)
        })
    })

    afterEach(() => {
        WebDriver.attachToSession.mockClear()
        WebDriver.newSession.mockClear()
    })
})
