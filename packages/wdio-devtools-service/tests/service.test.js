import DevToolsService from '../src'

import logger from 'wdio-logger'

jest.mock('../src/commands', () => {
    class CommandHandlerMock {
        constructor () {
            this.cdp = jest.fn()
        }
    }

    return CommandHandlerMock
})

jest.mock('../src/utils', () => {
    let wasCalled = false
    return {
        findChromePort: jest.fn().mockImplementation(() => {
            if (!wasCalled) {
                wasCalled = true
                return 42
            }
            throw new Error('boom')
        }),
        getCDPClient: jest.fn()
    }
})

test('beforeSession', () => {
    const service = new DevToolsService()
    expect(service.isSupported).toBe(false)

    service.beforeSession(null, { browserName: 'firefox' })
    expect(service.isSupported).toBe(false)
    service.beforeSession(null, { browserName: 'chrome', version: 62 })
    expect(service.isSupported).toBe(false)

    service.beforeSession(null, { browserName: 'chrome', version: 65 })
    expect(service.isSupported).toBe(true)
})

test('if not supported by browser', async () => {
    global.browser = { addCommand: jest.fn() }

    const service = new DevToolsService()
    service.isSupported = false

    await service.before()
    expect(global.browser.addCommand.mock.calls).toHaveLength(1)
    expect(global.browser.addCommand.mock.calls[0][0]).toBe('cdp')
    expect(global.browser.addCommand.mock.calls[0][1].toString()).toContain('throw new Error')
})

test('if supported by browser', async () => {


    const service = new DevToolsService()
    service.isSupported = true
    await service.before()
    expect(service.commandHandler.cdp).toBeCalledWith('Network', 'enable')
    expect(service.commandHandler.cdp).toBeCalledWith('Page', 'enable')
})

test('initialization fails', async () => {
    jest.mock('../src/utils', () => ({
        findChromePort: () => {
            throw new Error('boom!')
        },
        getCDPClient: jest.fn()
    }))

    const service = new DevToolsService()
    service.isSupported = true
    await service.before()

    expect(service.commandHandler).toBe(undefined)
    expect(logger().error.mock.calls.pop()[0]).toContain(`Couldn't connect to chrome: Error: boom`)
})
//     async before () {
//         if (!this.isSupported) {
//             return global.browser.addCommand('cdp', /* istanbul ignore next */ () => {
//                 throw new Error(UNSUPPORTED_ERROR_MESSAGE)
//             })
//         }
//
//         try {
//             const chromePort = await findChromePort()
//             const client = await getCDPClient(chromePort)
//             this.commandHandler = new CommandHandler(client, global.browser)
//         } catch (err) {
//             log.error(`Couldn't connect to chrome: ${err.stack}`)
//             return
//         }
//
//         /**
//          * enable network and page domain for resource analysis
//          */
//         await this.commandHandler.cdp('Network', 'enable')
//         await this.commandHandler.cdp('Page', 'enable')
//     }
// }
