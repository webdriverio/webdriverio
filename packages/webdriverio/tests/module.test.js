import path from 'path'
import logger from '@wdio/logger'
import { detectBackend } from '@wdio/config'
import { runFnInFiberContext } from '@wdio/utils'

import { remote, multiremote, attach } from '../src'

jest.mock('webdriver', () => {
    const client = {
        sessionId: 'foobar-123',
        addCommand: jest.fn(),
        overwriteCommand: jest.fn(),
        strategies: new Map()
    }
    const newSessionMock = jest.fn()
    newSessionMock.mockReturnValue(new Promise((resolve) => resolve(client)))
    newSessionMock.mockImplementation((params, cb) => {
        let result = cb(client, params)
        if (params.test_multiremote) {
            result.options = { logLevel: 'error' }
        }
        return result
    })

    const module = {
        newSession: newSessionMock,
        attachToSession: jest.fn().mockReturnValue(client)
    }

    return {
        ...module,
        default: module
    }
})

jest.mock('@wdio/config', () => {
    const validateConfigMock = {
        validateConfig: jest.fn().mockReturnValue({ automationProtocol: 'webdriver' }),
        detectBackend: jest.fn(),
    }
    return validateConfigMock
})

const WebDriver = require('webdriver').default

describe('WebdriverIO module interface', () => {
    it('should provide remote and multiremote access', () => {
        expect(typeof remote).toBe('function')
        expect(typeof attach).toBe('function')
        expect(typeof multiremote).toBe('function')
    })

    describe('remote function', () => {
        it('creates a webdriver session', async () => {
            const browser = await remote({ capabilities: {}, logLevel: 'trace' })
            expect(browser.sessionId).toBe('foobar-123')
            expect(logger.setLogLevelsConfig).toBeCalledWith(undefined, 'trace')
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

        it('should set process.env.WDIO_LOG_PATH if outputDir is set in the options', async()=>{
            let testDirPath = './logs'
            await remote({ outputDir: testDirPath, capabilities: { browserName: 'firefox' } })
            expect(process.env.WDIO_LOG_PATH).toEqual(path.join(testDirPath, 'wdio.log'))
        })

        it('should not wrap custom commands into fiber context if used as standalone', async () => {
            const browser = await remote({ capabilities: {} })
            const customCommand = jest.fn()
            browser.addCommand('someCommand', customCommand)
            expect(runFnInFiberContext).toBeCalledTimes(0)

            browser.overwriteCommand('someCommand', customCommand)
            expect(runFnInFiberContext).toBeCalledTimes(0)
        })

        it('should wrap custom commands into fiber context', async () => {
            const browser = await remote({ capabilities: {}, runner: 'local' })
            const customCommand = jest.fn()
            browser.addCommand('someCommand', customCommand)
            expect(runFnInFiberContext).toBeCalledTimes(1)

            browser.overwriteCommand('someCommand', customCommand)
            expect(runFnInFiberContext).toBeCalledTimes(2)
        })

        it('should attach custom locators to the strategies', async () => {
            const browser = await remote({ capabilities: {} })
            const fakeFn = () => { return 'test'}

            browser.addLocatorStrategy('test-strat', fakeFn)

            expect(browser.strategies.get('test-strat').toString()).toBe(fakeFn.toString())
        })

        it('throws error if trying to overwrite locator strategy', async () => {
            expect.assertions(1)
            const browser = await remote({ capabilities: {} })

            try {
                const fakeFn = () => { return 'test'}
                browser.addLocatorStrategy('test-strat', fakeFn)
            } catch (error) {
                browser.strategies.delete('test-strat')
                expect(error.message).toBe('Strategy test-strat already exists')
            }
        })
    })

    describe('multiremote', () => {
        it('register multiple clients', async () => {
            await multiremote({
                browserA: { test_multiremote: true, capabilities: { browserName: 'chrome' } },
                browserB: { test_multiremote: true, capabilities: { browserName: 'firefox' } }
            })
            expect(WebDriver.attachToSession).toBeCalled()
            expect(WebDriver.newSession.mock.calls).toHaveLength(2)
        })

        it('should attach custom locators to the strategies', async () => {
            const driver = await multiremote({
                browserA: { test_multiremote: true, capabilities: { browserName: 'chrome' } },
                browserB: { test_multiremote: true, capabilities: { browserName: 'firefox' } }
            })

            const fakeFn = () => { return 'test'}
            driver.addLocatorStrategy('test-strat', fakeFn)
            expect(driver.strategies.get('test-strat').toString()).toBe(fakeFn.toString())
        })

        it('throws error if trying to overwrite locator strategy', async () => {
            expect.assertions(1)
            const driver = await multiremote({
                browserA: { test_multiremote: true, capabilities: { browserName: 'chrome' } },
                browserB: { test_multiremote: true, capabilities: { browserName: 'firefox' } }
            })

            try {
                const fakeFn = () => { return 'test'}
                driver.addLocatorStrategy('test-strat', fakeFn)
            } catch (error) {
                driver.strategies.delete('test-strat')
                expect(error.message).toBe('Strategy test-strat already exists')
            }
        })
    })

    describe('attach', () => {
        it('attaches', () => {
            attach({})
            expect(WebDriver.attachToSession).toBeCalled()
        })
    })

    afterEach(() => {
        WebDriver.attachToSession.mockClear()
        WebDriver.newSession.mockClear()
    })
})
