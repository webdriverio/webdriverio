import puppeteer from 'puppeteer-core'
import logger from '@wdio/logger'

import { getNetwork } from '../../src/utils/getNetworkObject'

const log = logger('webdriverio')

jest.mock('../../src/commands/network', () => ({
    throttle: jest.fn().mockReturnValue(Promise.resolve(null)),
    test123: jest.fn().mockReturnValue(Promise.resolve(123))
}))

const browser = {
    sessionId: '1234',
    capabilities: { browserName: 'foobar' },
    __propertiesObject__: {},
    options: {
        requestedCapabilities: { requested: 'capabilities' }
    }
}

beforeEach(() => {
    puppeteer.connect.mockClear()
    log.info.mockClear()
})

test('should generate network scope', () => {
    const scope = getNetwork.call(browser)
    expect(scope.sessionId).toBe('1234')
    expect(scope.capabilities).toEqual({ browserName: 'foobar' })
    expect(Object.getPrototypeOf(scope).constructor.name).toBe('Network')
})

describe('attach Puppeteer', () => {
    it('should fail if capabilities are not supported', async () => {
        const scope = getNetwork.call(browser)
        const err = await scope.throttle().catch(err => err)
        expect(err.message).toContain('Network primitives aren\'t available for this session.')
    })

    it('should pass for Chrome', async () => {
        const scope = getNetwork.call({
            ...browser,
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    debuggerAddress: 'localhost:1234'
                }
            }
        })
        await scope.throttle('online')
        expect(typeof scope.puppeteer).toBe('object')
        expect(puppeteer.connect.mock.calls).toMatchSnapshot()
    })

    it('should pass for Firefox', async () => {
        const scope = getNetwork.call({
            ...browser,
            capabilities: {
                browserName: 'firefox',
                browserVersion: '79.0b'
            },
            options: {
                requestedCapabilities: {
                    'moz:firefoxOptions': {
                        args: ['foo', 'bar', '-remote-debugging-port', 4321, 'barfoo']
                    }
                }
            }
        })
        await scope.throttle('online')
        expect(typeof scope.puppeteer).toBe('object')
        expect(puppeteer.connect.mock.calls).toMatchSnapshot()
    })

    it('should not re-attach if connection was already established', async () => {
        const scope = getNetwork.call({
            ...browser,
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    debuggerAddress: 'localhost:1234'
                }
            }
        })
        scope.puppeteer = 'foobar'
        await scope.throttle('online')
        expect(puppeteer.connect).toHaveBeenCalledTimes(0)
    })

    it('should only attach Puppeteer if testing locally', async () => {
        const scope = getNetwork.call({
            ...browser,
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    debuggerAddress: 'localhost:1234'
                }
            }
        })
        scope.isSauce = true
        await scope.throttle('online')
        expect(puppeteer.connect).toHaveBeenCalledTimes(0)
    })

    it('should log commands', async () => {
        const scope = getNetwork.call({
            ...browser,
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    debuggerAddress: 'localhost:1234'
                }
            }
        })
        scope.isSauce = true
        await scope.test123()
        expect(log.info.mock.calls).toMatchSnapshot()
    })
})
