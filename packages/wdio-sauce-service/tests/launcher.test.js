import SauceConnectLauncher from 'sauce-connect-launcher'
import logger from '@wdio/logger'

import SauceServiceLauncher from '../src/launcher'

const log = logger()

test('onPrepare', async () => {
    const options = {
        sauceConnect: true,
        sauceConnectOpts: {
            port: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const caps = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345'
    }
    const service = new SauceServiceLauncher(options)
    expect(service.sauceConnectProcess).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual([{
        'sauce:options': { tunnelIdentifier: 'my-tunnel' }
    }])
    expect(service.sauceConnectProcess).not.toBeUndefined()
    expect(SauceConnectLauncher).toBeCalled()
})

test('onPrepare w/o identifier', async () => {
    const options = {
        sauceConnect: true
    }
    const caps = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345'
    }
    const service = new SauceServiceLauncher(options)
    expect(service.sauceConnectProcess).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps[0]['sauce:options'].tunnelIdentifier).toContain('SC-tunnel-')
    expect(service.sauceConnectProcess).not.toBeUndefined()
    expect(SauceConnectLauncher).toBeCalled()
    expect(log.info.mock.calls[0][0]).toContain('Sauce Connect successfully started after')
})

test('onPrepare w/ SauceConnect w/o scRelay', async () => {
    const options = {
        sauceConnect: true
    }
    const caps = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345',
        sauceConnect: true
    }
    const service = new SauceServiceLauncher(options)
    expect(service.sauceConnectProcess).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(service.sauceConnectProcess).not.toBeUndefined()
    expect(config.port).toBe(undefined)
    expect(config.protocol).toBe(undefined)
    expect(config.hostname).toBe(undefined)
})

test('onPrepare multiremote', async () => {
    const options = {
        sauceConnect: true,
        scRelay: true,
        sauceConnectOpts: {
            port: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const caps = {
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
    }
    const service = new SauceServiceLauncher(options)
    expect(service.sauceConnectProcess).toBeUndefined()
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
    expect(service.sauceConnectProcess).not.toBeUndefined()
})

test('onPrepare if sauceTunnel is not set', async () => {
    const options = {
        sauceConnectOpts: {
            port: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const caps = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345'
    }
    const service = new SauceServiceLauncher(options)
    expect(service.sauceConnectProcess).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual([{}])
    expect(service.sauceConnectProcess).toBeUndefined()
    expect(SauceConnectLauncher).not.toBeCalled()
})

test('onPrepare multiremote with tunnel identifier and with w3c caps ', async () => {
    const options = {
        sauceConnect: true,
        sauceConnectOpts: {
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const caps = {
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
    }
    const service = new SauceServiceLauncher(options)
    expect(service.sauceConnectProcess).toBeUndefined()
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
    expect(service.sauceConnectProcess).not.toBeUndefined()
})

test('onPrepare without tunnel identifier and without w3c caps ', async () => {
    const options = {
        sauceConnect: false
    }
    const caps = [{
        browserName: 'chrome'
    }, {
        browserName: 'firefox',
        tunnelIdentifier: 'fish'
    }]
    const config = {
        user: 'foobaruser',
        key: '12345'
    }
    const service = new SauceServiceLauncher(options)
    expect(service.sauceConnectProcess).toBeUndefined()
    await service.onPrepare(config, caps)

    expect(caps).toEqual([{
        browserName: 'chrome'
    }, {
        browserName: 'firefox',
        tunnelIdentifier: 'fish'
    }])
    expect(service.sauceConnectProcess).toBeUndefined()
})

test('onPrepare without tunnel identifier and with w3c caps ', async () => {
    const options = {
        sauceConnect: false
    }
    const caps = [{
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
    }
    const service = new SauceServiceLauncher(options)
    expect(service.sauceConnectProcess).toBeUndefined()
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
    expect(service.sauceConnectProcess).toBeUndefined()
})

test('onPrepare with tunnel identifier and with w3c caps ', async () => {
    const options = {
        sauceConnect: true,
        scRelay: true,
        sauceConnectOpts: {
            port: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const caps = [{
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
    }
    const service = new SauceServiceLauncher(options)
    expect(service.sauceConnectProcess).toBeUndefined()
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
    expect(service.sauceConnectProcess).not.toBeUndefined()
})

test('onComplete', async () => {
    const service = new SauceServiceLauncher({}, [], {})
    expect(service.onComplete()).toBeUndefined()

    service.sauceConnectProcess = { close: jest.fn() }
    service.onComplete()
    expect(service.sauceConnectProcess.close).toBeCalled()
})

afterEach(async () => {
    SauceConnectLauncher.mockClear()
})
