import path from 'node:path'
import logger from '@wdio/logger'
import SauceLabs from 'saucelabs'
import type { Capabilities, Options } from '@wdio/types'
import { expect, test, vi, beforeEach } from 'vitest'

import SauceServiceLauncher from '../src/launcher.js'
import type { SauceServiceConfig } from '../src/types.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('saucelabs', () => ({
    default: {
        default: class SauceLabsMock {
            static instances: SauceLabsMock[] = []

            stop: Function
            startSauceConnect: Function

            constructor (public options: SauceServiceConfig) {
                this.stop = vi.fn()
                this.startSauceConnect = vi.fn().mockReturnValue(this)
                SauceLabsMock.instances.push(this)
            }
        }
    }
}))

const log = logger('')

test('onPrepare w/ SauceConnect w/ tunnelName w/ JWP', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        sauceConnectOpts: {
            tunnelName: 'my-tunnel'
        }
    }
    const caps = [{}] as WebdriverIO.Capabilities[]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps as never, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual([{
        'sauce:options': {
            tunnelName: 'my-tunnel'
        }
    }])

    // @ts-ignore mock feature
    expect(SauceLabs.default.instances).toHaveLength(1)
    // @ts-ignore mock feature
    expect(SauceLabs.default.instances[0].startSauceConnect).toBeCalledTimes(1)
    expect(service['_sauceConnectProcess']).not.toBeUndefined()
})

test('onPrepare sets runner in metadata', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        sauceConnectOpts: {},
    }
    const caps = [{}] as WebdriverIO.Capabilities[]
    const config = {} as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps as never, config)
    const startTunnelMock = vi.fn()
    service.startTunnel = startTunnelMock
    await service.onPrepare(config, caps)
    expect(startTunnelMock.mock.calls[0][0].metadata).toBe('runner=webdriverio')
})

test('onPrepare w/ SauceConnect w/o tunnelName w/ JWP', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        sauceConnectOpts: {}
    }
    const caps = [{}] as WebdriverIO.Capabilities[]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps as never, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps[0]['sauce:options']?.tunnelName).toContain('SC-tunnel-')

    // @ts-ignore mock feature
    expect(SauceLabs.default.instances).toHaveLength(1)
    // @ts-ignore mock feature
    expect(SauceLabs.default.instances[0].startSauceConnect).toBeCalledTimes(1)
    expect(service['_sauceConnectProcess']).not.toBeUndefined()
})

test('onPrepare w/ SauceConnect w/ tunnelName w/ W3C', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        sauceConnectOpts: {
            tunnelName: 'my-tunnel'
        }
    }
    const caps = [{ 'sauce:options': { extendedDebugging: false } }] as WebdriverIO.Capabilities[]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps as never, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps[0]['sauce:options']?.tunnelName).toContain('my-tunnel')
    expect(service['_sauceConnectProcess']).not.toBeUndefined()

    // @ts-ignore mock feature
    expect(SauceLabs.default.instances).toHaveLength(1)
    // @ts-ignore mock feature
    expect(SauceLabs.default.instances[0].startSauceConnect).toBeCalledTimes(1)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(vi.mocked(log.info).mock.calls[2][0]).toContain('Sauce Connect successfully started after')
})

test('onPrepare w/ SauceConnect w/o identifier w/ W3C', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true
    }
    const caps = [{ 'appium:deviceName': 'Samsung Galaxy S10' }] as WebdriverIO.Capabilities[]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps as never, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps[0]['sauce:options']?.tunnelName).toContain('SC-tunnel-')
    expect(service['_sauceConnectProcess']).not.toBeUndefined()

    // @ts-ignore mock feature
    expect(SauceLabs.default.instances).toHaveLength(1)
    // @ts-ignore mock feature
    expect(SauceLabs.default.instances[0].startSauceConnect).toBeCalledTimes(1)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(vi.mocked(log.info).mock.calls[2][0]).toContain('Sauce Connect successfully started after')
})

test('onPrepare w/ SauceConnect', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true
    }
    const caps = [{}] as WebdriverIO.Capabilities[]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps as never, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(service['_sauceConnectProcess']).not.toBeUndefined()
    expect(config.port).toBe(undefined)
    expect(config.protocol).toBe(undefined)
    expect(config.hostname).toBe(undefined)
})

test('onPrepare w/ SauceConnect w/ region EU', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true
    }
    const caps = [{}] as WebdriverIO.Capabilities[]
    const config = {
        user: 'foobaruser',
        key: '12345',
        region: 'eu'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps as never, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(service['_sauceConnectProcess']).not.toBeUndefined()
    // @ts-ignore mock feature
    expect(SauceLabs.default.instances).toHaveLength(1)
    // @ts-ignore mock feature
    expect(SauceLabs.default.instances[0].options.region).toBe('eu')
})

test('onPrepare multiremote', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        sauceConnectOpts: {
            tunnelName: 'my-tunnel'
        }
    }
    const caps: Capabilities.RequestedMultiremoteCapabilities = {
        browserA: {
            capabilities: { browserName: 'chrome' }
        },
        browserB: {
            capabilities: {
                browserName: 'firefox',
                'sauce:options': { tunnelName: 'fish' }
            }
        }
    }
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps as never, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual({
        browserA: {
            capabilities: {
                browserName: 'chrome',
                'sauce:options': { tunnelName: 'my-tunnel' }
            }
        },
        browserB: {
            capabilities: {
                browserName: 'firefox',
                'sauce:options': { tunnelName: 'fish' }
            },
        }
    })
    expect(service['_sauceConnectProcess']).not.toBeUndefined()
})

test('onPrepare parallel multiremote', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        sauceConnectOpts: {
            tunnelName: 'my-tunnel'
        }
    }
    const caps: Capabilities.RequestedMultiremoteCapabilities[] = [{
        browserA: {
            capabilities: { browserName: 'chrome' }
        },
        browserB: {
            capabilities: {
                browserName: 'firefox',
                'sauce:options': { tunnelName: 'fish' }
            }
        }
    }, {
        browserC: {
            capabilities: { browserName: 'chrome' }
        },
        browserD: {
            capabilities: {
                browserName: 'firefox',
                'sauce:options': { tunnelName: 'fish' }
            }
        }
    }]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps as never, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual([{
        browserA: {
            capabilities: {
                browserName: 'chrome',
                'sauce:options': { tunnelName: 'my-tunnel' }
            }
        },
        browserB: {
            capabilities: {
                browserName: 'firefox',
                'sauce:options': { tunnelName: 'fish' }
            },
        }
    }, {
        browserC: {
            capabilities: {
                browserName: 'chrome',
                'sauce:options': { tunnelName: 'my-tunnel' }
            }
        },
        browserD: {
            capabilities: {
                browserName: 'firefox',
                'sauce:options': { tunnelName: 'fish' }
            },
        }
    }])
    expect(service['_sauceConnectProcess']).not.toBeUndefined()
})

test('onPrepare if sauceTunnel is not set', async () => {
    const options: SauceServiceConfig = {
        sauceConnectOpts: {
            tunnelName: 'my-tunnel'
        }
    }
    const caps = [{}] as WebdriverIO.Capabilities[]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps as never, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual([{}])
    expect(service['_sauceConnectProcess']).toBeUndefined()
    // @ts-ignore mock feature
    expect(SauceLabs.default.instances).toHaveLength(1)
    // @ts-ignore mock feature
    expect(SauceLabs.default.instances[0].startSauceConnect).toBeCalledTimes(0)
})

test('onPrepare multiremote with tunnel identifier and with w3c caps ', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        sauceConnectOpts: {
            tunnelName: 'my-tunnel'
        }
    }
    const caps: Capabilities.RequestedMultiremoteCapabilities = {
        browserA: {
            capabilities: {
                browserName: 'chrome',
                'sauce:options': {
                    commandTimeout: 600
                }
            }
        },
        browserB: {
            capabilities: {
                browserName: 'firefox',
                'sauce:options': {
                    commandTimeout: 600,
                    tunnelName: 'fish'
                }
            }
        }
    }
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps as never, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual({
        browserA: {
            capabilities: {
                browserName: 'chrome',
                'sauce:options': {
                    commandTimeout: 600,
                    tunnelName: 'my-tunnel'
                }
            }
        },
        browserB: {
            capabilities: {
                browserName: 'firefox',
                'sauce:options': {
                    commandTimeout: 600,
                    tunnelName: 'fish'
                }
            }
        }
    })
    expect(service['_sauceConnectProcess']).not.toBeUndefined()
})

test('onPrepare without tunnel identifier and with w3c caps ', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: false
    }
    const caps: WebdriverIO.Capabilities[] = [{
        browserName: 'chrome',
        'sauce:options': {
            commandTimeout: 600,
            tunnelName: 'fish'
        }
    }, {
        browserName: 'firefox',
        'sauce:options': {
            commandTimeout: 600
        }
    }]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps as never, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual([{
        browserName: 'chrome',
        'sauce:options': {
            commandTimeout: 600,
            tunnelName: 'fish'
        }
    }, {
        browserName: 'firefox',
        'sauce:options': {
            commandTimeout: 600
        }
    }])
    expect(service['_sauceConnectProcess']).toBeUndefined()
})

test('onPrepare with tunnel identifier and with w3c caps ', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        sauceConnectOpts: {
            tunnelName: 'my-tunnel'
        }
    }
    const caps: WebdriverIO.Capabilities[] = [{
        browserName: 'chrome',
        'sauce:options': {
            commandTimeout: 600,
            tunnelName: 'fish'
        }
    }, {
        browserName: 'firefox',
        'sauce:options': {
            commandTimeout: 600
        }
    }]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps as never, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual([{
        browserName: 'chrome',
        'sauce:options': {
            commandTimeout: 600,
            tunnelName: 'fish'
        }
    }, {
        browserName: 'firefox',
        'sauce:options': {
            commandTimeout: 600,
            tunnelName: 'my-tunnel'
        }
    }])
    expect(service['_sauceConnectProcess']).not.toBeUndefined()
})

test('startTunnel fail twice and recover', async ()=> {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        sauceConnectOpts: {
            tunnelName: 'my-tunnel'
        }
    }
    const service = new SauceServiceLauncher(options, undefined as never, {} as Options.Testrunner)
    vi.mocked(service['_api'].startSauceConnect)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockRejectedValueOnce(new Error('ENOENT'))
    await service.startTunnel({})

    // @ts-ignore mock feature
    expect(SauceLabs.default.instances[0].startSauceConnect).toBeCalledTimes(3)
})

test('startTunnel fail three and throws error', async ()=> {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        sauceConnectOpts: {
            tunnelName: 'my-tunnel'
        }
    }
    const service = new SauceServiceLauncher(options, undefined as never, {} as Options.Testrunner)
    vi.mocked(service['_api'].startSauceConnect)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockRejectedValueOnce(new Error('ENOENT'))

    expect(async () => {
        await service.startTunnel({})
    }).rejects.toThrowError('ENOENT')

})

test('onComplete', async () => {
    const service = new SauceServiceLauncher({}, undefined as never, {} as Options.Testrunner)
    expect(service.onComplete()).toBeUndefined()

    service['_sauceConnectProcess'] = { close: vi.fn() } as any
    service.onComplete()
    expect(service['_sauceConnectProcess']?.close).toBeCalled()
})

beforeEach(async () => {
    vi.mocked(log.info).mockClear()
    // @ts-ignore mock feature
    SauceLabs.default.instances = []
})
