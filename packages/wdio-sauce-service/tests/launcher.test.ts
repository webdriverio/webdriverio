import logger from '@wdio/logger'
import SauceLabs from 'saucelabs'
import type { Capabilities, Options } from '@wdio/types'

import SauceServiceLauncher from '../src/launcher'
import type { SauceServiceConfig } from '../src/types'

jest.mock('saucelabs', () => {
    return class SauceLabsMock {
        static instances: SauceLabsMock[] = []

        stop: Function
        startSauceConnect: Function

        constructor (public options: SauceServiceConfig) {
            this.stop = jest.fn()
            this.startSauceConnect = jest.fn().mockReturnValue(this)
            SauceLabsMock.instances.push(this)
        }
    }
})

const log = logger('')

test('onPrepare', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        sauceConnectOpts: {
            sePort: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const caps = [{}] as Capabilities.DesiredCapabilities[]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual([{
        'sauce:options': { tunnelIdentifier: 'my-tunnel' }
    }])

    // @ts-ignore mock feature
    expect(SauceLabs.instances).toHaveLength(1)
    // @ts-ignore mock feature
    expect(SauceLabs.instances[0].startSauceConnect).toBeCalledTimes(1)
    expect(service['_sauceConnectProcess']).not.toBeUndefined()
})

test('onPrepare w/o identifier', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true
    }
    const caps = [{}] as Capabilities.DesiredCapabilities[]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps[0]['sauce:options']?.tunnelIdentifier).toContain('SC-tunnel-')
    expect(service['_sauceConnectProcess']).not.toBeUndefined()

    // @ts-ignore mock feature
    expect(SauceLabs.instances).toHaveLength(1)
    // @ts-ignore mock feature
    expect(SauceLabs.instances[0].startSauceConnect).toBeCalledTimes(1)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect((log.info as jest.Mock).mock.calls[0][0]).toContain('Sauce Connect successfully started after')
})

test('onPrepare w/ SauceConnect w/o scRelay', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true
    }
    const caps = [{}] as Capabilities.DesiredCapabilities[]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(service['_sauceConnectProcess']).not.toBeUndefined()
    expect(config.port).toBe(undefined)
    expect(config.protocol).toBe(undefined)
    expect(config.hostname).toBe(undefined)
})

test('onPrepare w/ SauceConnect w/ scRelay w/ default port', async () => {
    const options: SauceServiceConfig = {
        scRelay: true,
        sauceConnect: true,
        sauceConnectOpts: { tunnelIdentifier: 'test123' }
    }
    const caps = [{}] as Capabilities.DesiredCapabilities[]
    const config = {} as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(service['_sauceConnectProcess']).not.toBeUndefined()
    // @ts-ignore mock feature
    expect(SauceLabs.instances).toHaveLength(1)
    // @ts-ignore mock feature
    expect(SauceLabs.instances[0].startSauceConnect).toBeCalledWith({
        noAutodetect: true,
        sePort: 4445,
        tunnelIdentifier: 'test123',
    })
    // @ts-ignore
    expect(caps[0].port).toEqual(4445)
})

test('onPrepare w/ SauceConnect w/ region EU', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true
    }
    const caps = [{}] as Capabilities.DesiredCapabilities[]
    const config = {
        user: 'foobaruser',
        key: '12345',
        region: 'eu'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(service['_sauceConnectProcess']).not.toBeUndefined()
    // @ts-ignore mock feature
    expect(SauceLabs.instances).toHaveLength(1)
    // @ts-ignore mock feature
    expect(SauceLabs.instances[0].options.region).toBe('eu')
})

test('onPrepare multiremote', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        scRelay: true,
        sauceConnectOpts: {
            sePort: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const caps: Capabilities.MultiRemoteCapabilities = {
        browserA: {
            capabilities: { browserName: 'chrome' }
        },
        browserB: {
            capabilities: { browserName: 'firefox', tunnelIdentifier: 'fish' }
        }
    }
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual({
        browserA: {
            capabilities: {
                browserName: 'chrome',
                protocol: 'http',
                hostname: 'localhost',
                port: 4446,
                'sauce:options': { tunnelIdentifier: 'my-tunnel' }
            }
        },
        browserB: {
            capabilities: {
                browserName: 'firefox',
                protocol: 'http',
                hostname: 'localhost',
                port: 4446,
                'sauce:options': { tunnelIdentifier: 'fish' }
            },
        }
    })
    expect(service['_sauceConnectProcess']).not.toBeUndefined()
})

test('onPrepare if sauceTunnel is not set', async () => {
    const options: SauceServiceConfig = {
        sauceConnectOpts: {
            sePort: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const caps = [{}] as Capabilities.DesiredCapabilities[]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual([{}])
    expect(service['_sauceConnectProcess']).toBeUndefined()
    // @ts-ignore mock feature
    expect(SauceLabs.instances).toHaveLength(1)
    // @ts-ignore mock feature
    expect(SauceLabs.instances[0].startSauceConnect).toBeCalledTimes(0)
})

test('onPrepare multiremote with tunnel identifier and with w3c caps ', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        sauceConnectOpts: {
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const caps: Capabilities.MultiRemoteCapabilities = {
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
                    tunnelIdentifier: 'fish'
                }
            }
        }
    }
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual({
        browserA: {
            capabilities: {
                browserName: 'chrome',
                'sauce:options': {
                    commandTimeout: 600,
                    tunnelIdentifier: 'my-tunnel'
                }
            }
        },
        browserB: {
            capabilities: {
                browserName: 'firefox',
                'sauce:options': {
                    commandTimeout: 600,
                    tunnelIdentifier: 'fish'
                }
            }
        }
    })
    expect(service['_sauceConnectProcess']).not.toBeUndefined()
})

test('onPrepare without tunnel identifier and without w3c caps ', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: false
    }
    const caps: Capabilities.DesiredCapabilities[] = [{
        browserName: 'chrome'
    }, {
        browserName: 'firefox',
        tunnelIdentifier: 'fish'
    }]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual([{
        browserName: 'chrome'
    }, {
        browserName: 'firefox',
        tunnelIdentifier: 'fish'
    }])
    expect(service['_sauceConnectProcess']).toBeUndefined()
})

test('onPrepare without tunnel identifier and with w3c caps ', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: false
    }
    const caps: Capabilities.DesiredCapabilities[] = [{
        browserName: 'chrome',
        'sauce:options': {
            commandTimeout: 600,
            tunnelIdentifier: 'fish'
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
    const service = new SauceServiceLauncher(options, caps, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual([{
        browserName: 'chrome',
        'sauce:options': {
            commandTimeout: 600,
            tunnelIdentifier: 'fish'
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
        scRelay: true,
        sauceConnectOpts: {
            sePort: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const caps: Capabilities.DesiredCapabilities[] = [{
        browserName: 'chrome',
        'sauce:options': {
            commandTimeout: 600,
            tunnelIdentifier: 'fish'
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
    const service = new SauceServiceLauncher(options, caps, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual([{
        protocol: 'http',
        hostname: 'localhost',
        port: 4446,
        browserName: 'chrome',
        'sauce:options': {
            commandTimeout: 600,
            tunnelIdentifier: 'fish'
        }
    }, {
        protocol: 'http',
        hostname: 'localhost',
        port: 4446,
        browserName: 'firefox',
        'sauce:options': {
            commandTimeout: 600,
            tunnelIdentifier: 'my-tunnel'
        }
    }])
    expect(service['_sauceConnectProcess']).not.toBeUndefined()
})

test('onPrepare with tunnel identifier and without w3c caps ', async () => {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        scRelay: true,
        sauceConnectOpts: {
            sePort: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const caps: Capabilities.DesiredCapabilities[] = [{
        browserName: 'internet explorer',
        platform: 'Windows 7',
        tunnelIdentifier: 'fish'
    }, {
        browserName: 'internet explorer',
        version: '9'
    }, {
        deviceName: 'iPhone',
        platformName: 'iOS',
        tunnelIdentifier: 'fish-bar'
    }, {
        deviceName: 'iPhone',
        platformName: 'iOS',
    }, {
        deviceName: 'iPhone Simulator',
        platformName: 'iOS',
        tunnelIdentifier: 'foo-bar'
    }, {
        deviceName: 'iPhone Simulator',
        platformName: 'iOS',
    }]
    const config = {
        user: 'foobaruser',
        key: '12345'
    } as Options.Testrunner
    const service = new SauceServiceLauncher(options, caps, config)
    expect(service['_sauceConnectProcess']).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual([{
        protocol: 'http',
        hostname: 'localhost',
        port: 4446,
        browserName: 'internet explorer',
        platform: 'Windows 7',
        tunnelIdentifier: 'fish'
    }, {
        protocol: 'http',
        hostname: 'localhost',
        port: 4446,
        browserName: 'internet explorer',
        version: '9',
        tunnelIdentifier: 'my-tunnel'
    }, {
        protocol: 'http',
        hostname: 'localhost',
        port: 4446,
        deviceName: 'iPhone',
        platformName: 'iOS',
        tunnelIdentifier: 'fish-bar'
    }, {
        protocol: 'http',
        hostname: 'localhost',
        port: 4446,
        deviceName: 'iPhone',
        platformName: 'iOS',
        tunnelIdentifier: 'my-tunnel'
    }, {
        protocol: 'http',
        hostname: 'localhost',
        port: 4446,
        deviceName: 'iPhone Simulator',
        platformName: 'iOS',
        tunnelIdentifier: 'foo-bar'
    }, {
        protocol: 'http',
        hostname: 'localhost',
        port: 4446,
        deviceName: 'iPhone Simulator',
        platformName: 'iOS',
        tunnelIdentifier: 'my-tunnel'
    }])
    expect(service['_sauceConnectProcess']).not.toBeUndefined()
})

test('startTunnel fail twice and recover', async ()=> {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        sauceConnectOpts: {
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const service = new SauceServiceLauncher(options, [{}], {} as Options.Testrunner)
    ;(service['_api'].startSauceConnect as jest.Mock)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockRejectedValueOnce(new Error('ENOENT'))
    await service.startTunnel({})

    // @ts-ignore mock feature
    expect(SauceLabs.instances[0].startSauceConnect).toBeCalledTimes(3)
})

test('startTunnel fail three and throws error', async ()=> {
    const options: SauceServiceConfig = {
        sauceConnect: true,
        sauceConnectOpts: {
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const service = new SauceServiceLauncher(options, [{}], {} as Options.Testrunner)
    ;(service['_api'].startSauceConnect as jest.Mock)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockRejectedValueOnce(new Error('ENOENT'))

    expect(async () => {
        await service.startTunnel({})
    }).rejects.toThrowError('ENOENT')

})

test('onComplete', async () => {
    const service = new SauceServiceLauncher({}, [], {} as Options.Testrunner)
    expect(service.onComplete()).toBeUndefined()

    service['_sauceConnectProcess'] = { close: jest.fn() } as any
    service.onComplete()
    expect(service['_sauceConnectProcess']?.close).toBeCalled()
})

afterEach(async () => {
    // @ts-ignore mock feature
    SauceLabs.instances = []
})
