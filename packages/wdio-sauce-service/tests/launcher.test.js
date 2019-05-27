import SauceConnectLauncher from 'sauce-connect-launcher'

import SauceServiceLauncher from '../src/launcher'

test('onPrepare', () => {
    const caps = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345',
        sauceConnect: true,
        sauceConnectOpts: {
            port: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const service = new SauceServiceLauncher()
    expect(service.sauceConnectProcess).toBeUndefined()
    service.onPrepare(config, caps)

    expect(caps).toEqual([{ tunnelIdentifier: 'my-tunnel' }])
    expect(service.sauceConnectProcess).not.toBeUndefined()
    expect(SauceConnectLauncher).toBeCalled()
})

test('onPrepare w/o identifier', () => {
    const caps = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345',
        sauceConnect: true
    }
    const service = new SauceServiceLauncher()
    expect(service.sauceConnectProcess).toBeUndefined()
    service.onPrepare(config, caps)

    expect(caps).toEqual([{}])
    expect(service.sauceConnectProcess).not.toBeUndefined()
    expect(SauceConnectLauncher).toBeCalled()
})

test('onPrepare multiremote', () => {
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
        key: '12345',
        sauceConnect: true,
        sauceConnectOpts: {
            port: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const service = new SauceServiceLauncher()
    expect(service.sauceConnectProcess).toBeUndefined()
    service.onPrepare(config, caps)

    expect(caps).toEqual({
        browserA: {
            capabilities: { browserName: 'chrome', tunnelIdentifier: 'my-tunnel' }
        },
        browserB: {
            capabilities: { browserName: 'firefox', tunnelIdentifier: 'fish' }
        }
    })
    expect(service.sauceConnectProcess).not.toBeUndefined()
    expect(config.port).toBe(4446)
    expect(config.protocol).toBe('http')
    expect(config.hostname).toBe('localhost')
})

test('onPrepare if sauceTunnel is not set', () => {
    const caps = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345',
        sauceConnectOpts: {
            port: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const service = new SauceServiceLauncher()
    expect(service.sauceConnectProcess).toBeUndefined()
    service.onPrepare(config, caps)

    expect(caps).toEqual([{}])
    expect(service.sauceConnectProcess).toBeUndefined()
    expect(SauceConnectLauncher).not.toBeCalled()
})

test('onPrepare multiremote with tunnel identifier and with w3c caps ', () => {
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
        key: '12345',
        sauceConnect: true,
        sauceConnectOpts: {
            port: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const service = new SauceServiceLauncher()
    expect(service.sauceConnectProcess).toBeUndefined()
    service.onPrepare(config, caps)

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
    expect(config.port).toBe(4446)
    expect(config.protocol).toBe('http')
    expect(config.hostname).toBe('localhost')
})

test('onPrepare with tunnel identifier and without w3c caps ', () => {
    const caps = [{
        browserName: 'chrome'
    }, {
        browserName: 'firefox',
        tunnelIdentifier: 'fish'
    }]
    const config = {
        user: 'foobaruser',
        key: '12345',
        sauceConnect: true,
        sauceConnectOpts: {
            port: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const service = new SauceServiceLauncher()
    expect(service.sauceConnectProcess).toBeUndefined()
    service.onPrepare(config, caps)

    expect(caps).toEqual([{
        browserName: 'chrome',
        tunnelIdentifier: 'my-tunnel'
    }, {
        browserName: 'firefox',
        tunnelIdentifier: 'fish'
    }])
    expect(service.sauceConnectProcess).not.toBeUndefined()
    expect(config.port).toBe(4446)
    expect(config.protocol).toBe('http')
    expect(config.hostname).toBe('localhost')
})

test('onPrepare without tunnel identifier and without w3c caps ', () => {
    const caps = [{
        browserName: 'chrome'
    }, {
        browserName: 'firefox',
        tunnelIdentifier: 'fish'
    }]
    const config = {
        user: 'foobaruser',
        key: '12345',
        sauceConnect: false
    }
    const service = new SauceServiceLauncher()
    expect(service.sauceConnectProcess).toBeUndefined()
    service.onPrepare(config, caps)

    expect(caps).toEqual([{
        browserName: 'chrome'
    }, {
        browserName: 'firefox',
        tunnelIdentifier: 'fish'
    }])
    expect(service.sauceConnectProcess).toBeUndefined()
})

test('onPrepare without tunnel identifier and with w3c caps ', () => {
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
        key: '12345',
        sauceConnect: false
    }
    const service = new SauceServiceLauncher()
    expect(service.sauceConnectProcess).toBeUndefined()
    service.onPrepare(config, caps)

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

test('onPrepare with tunnel identifier and with w3c caps ', () => {
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
        key: '12345',
        sauceConnect: true,
        sauceConnectOpts: {
            port: 4446,
            tunnelIdentifier: 'my-tunnel'
        }
    }
    const service = new SauceServiceLauncher()
    expect(service.sauceConnectProcess).toBeUndefined()
    service.onPrepare(config, caps)

    expect(caps).toEqual([{
        browserName: 'chrome',
        'sauce:options': {
            commandTimeout: 600,
            tunnelIdentifier: 'fish'
        }
    }, {
        browserName: 'firefox',
        'sauce:options': {
            commandTimeout: 600,
            tunnelIdentifier: 'my-tunnel'
        }
    }])
    expect(service.sauceConnectProcess).not.toBeUndefined()
    expect(config.port).toBe(4446)
    expect(config.protocol).toBe('http')
    expect(config.hostname).toBe('localhost')
})

test('onComplete', () => {
    const service = new SauceServiceLauncher()
    expect(service.onComplete()).toBeUndefined()

    service.sauceConnectProcess = { close: jest.fn() }
    service.onComplete()
    expect(service.sauceConnectProcess.close).toBeCalled()
})

afterEach(() => {
    SauceConnectLauncher.mockClear()
})
