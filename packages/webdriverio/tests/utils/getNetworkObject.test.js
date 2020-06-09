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

// /**
//  * Command wrapper for pure WebdriverIO commands
//  * @param {String}   commandName name of the command to be called
//  * @param {Function} command     actual command to execute
//  */
// export const command = (commandName, command) => {
//     return async function (...args) {
//         this.emit('command', { method: commandName, body: args })
//         log.info('COMMAND', commandCallStructure(commandName, args))

//         /**
//          * attach Puppeteer to the session if running locally
//          */
//         if (!this.isSauce) {
//             await getPuppeteer.call(this)
//         }

//         const result = await command.value.apply(this, args)

//         if (result != null) {
//             log.info('RESULT', result.value)
//         }

//         return result
//     }
// }

// /**
//  * attach puppeteer to the driver scope so it can be used in the
//  * command
//  */
// export const getPuppeteer = async function getPuppeteer () {
//     /**
//      * check if we already connected Puppeteer and if so return
//      * that instance
//      */
//     if (this.puppeteer) {
//         return this.puppeteer
//     }

//     /**
//      * attach to Chromes debugger session
//      */
//     if (this.capabilities['goog:chromeOptions'] && this.capabilities['goog:chromeOptions'].debuggerAddress) {
//         this.puppeteer = await puppeteer.connect({
//             browserURL: `http://${this.capabilities['goog:chromeOptions'].debuggerAddress}`,
//             defaultViewport: null
//         })
//         return this.puppeteer
//     }

//     /**
//      * attach to Firefox debugger session
//      */
//     if (this.capabilities.browserName.toLowerCase() === 'firefox') {
//         const majorVersion = parseInt(this.capabilities.browserVersion.split('.').shift(), 10)
//         if (majorVersion >= 79) {
//             const ffArgs = this.requestedCapabilities['moz:firefoxOptions'].args
//             const rdPort = ffArgs[ffArgs.findIndex((arg) => arg === FF_REMOTE_DEBUG_ARG) + 1]
//             this.puppeteer = await puppeteer.connect({
//                 browserURL: `http://localhost:${rdPort}`,
//                 defaultViewport: null
//             })
//             return this.puppeteer
//         }
//     }

//     throw new Error(
//         'Network primitives aren\'t available for this session. ' +
//         'This feature is only support for local Chrome, Firefox and Edge testing.'
//     )
// }
