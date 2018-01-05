import { remote, multiremote } from '../src'

jest.mock('webdriver', () => {
    const client = {
        sessionId: 'foobar-123',
        addCommand: jest.fn()
    }
    const newSessionMock = jest.fn()
    newSessionMock.mockReturnValue(new Promise((resolve) => resolve(client)))
    newSessionMock.mockImplementation((params, cb) => cb(client, params))

    return { newSession: newSessionMock }
})

jest.mock('wdio-config', () => {
    const validateConfigMock = {
        validateConfig: jest.fn(),
        detectBackend: jest.fn()
    }
    return validateConfigMock
})

describe('WebdriverIO module interface', () => {
    it('should provide remote and multiremote access', () => {
        expect(typeof remote).toBe('function')
        expect(typeof multiremote).toBe('function')
    })

    describe('remote function', () => {
        it('creates a webdriver session', async () => {
            const browser = await remote()
            expect(browser.sessionId).toBe('foobar-123')
        })

        it('allows to propagate a modifier', async () => {
            const browser = await remote('foo', (client) => {
                client.foobar = 'barfoo'
                return client
            })
            expect(browser.sessionId).toBe('foobar-123')
            expect(browser.foobar).toBe('barfoo')
        })
    })

    describe('multiremote', () => {
        it('should exist', () => {
            expect(multiremote()).toBe('NYI')
        })
    })
})
