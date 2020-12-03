import logger from '@wdio/logger'

import TestingBotLauncher from '../src/launcher'

const log = logger('')

describe('wdio-testingbot-service', () => {
    const execute = jest.fn()

    afterEach(() => {
        execute.mockReset()
    })

    it('onPrepare: tbTunnel is undefined', async () => {
        const options = { tbTunnel: undefined } as any
        const tbLauncher = new TestingBotLauncher(options)
        const caps = {} as any
        await tbLauncher.onPrepare({}, caps)
        expect(tbLauncher.tbTunnelOpts).toBeUndefined()
        expect(tbLauncher.tunnel).toBeUndefined()
        expect(options.protocol).toBeUndefined()
        expect(options.hostname).toBeUndefined()
        expect(options.port).toBeUndefined()
        expect(options.path).toBeUndefined()
    })

    it('onPrepare', async () => {
        const options: TestingbotOptions = {
            tbTunnel: true,
            tbTunnelOpts: {
                tunnelIdentifier: 'some options',
                apiKey: 'user',
                apiSecret: 'key',
            }
        }
        const config: any = {
            user: 'user',
            key: 'key'
        }
        const caps = [{}] as any
        const tbLauncher = new TestingBotLauncher(options)

        await tbLauncher.onPrepare(config, caps)
        expect(tbLauncher.tbTunnelOpts).toMatchObject({ apiKey: 'user', apiSecret: 'key', tunnelIdentifier: 'some options' })
        expect((log.info as jest.Mock).mock.calls[0][0]).toContain('TestingBot tunnel successfully started after')
    })

    it('should merge tunnelIdentifier in tb:options', async () => {
        const options: TestingbotOptions = {
            tbTunnel: true,
            tbTunnelOpts: {
                apiKey: 'user',
                apiSecret: 'key',
                tunnelIdentifier: 'my-tunnel'
            }
        }
        const config: any = {
            user: 'user',
            key: 'key'
        }
        const caps = [{
            'tb:options': {
                build: 'unit-test',
            }
        }] as any
        const tbLauncher = new TestingBotLauncher(options)

        await tbLauncher.onPrepare(config, caps)
        expect(caps).toEqual([{
            'tb:options': {
                'tunnel-identifier': 'my-tunnel',
                build: 'unit-test',
            }
        }])
    })

    it('should merge tunnelIdentifier in tb:options in multiremote', async () => {
        const options: TestingbotOptions = {
            tbTunnel: true,
            tbTunnelOpts: {
                apiKey: 'user',
                apiSecret: 'key',
                tunnelIdentifier: 'my-tunnel'
            }
        }
        const config: any = {
            user: 'user',
            key: 'key'
        }
        const caps = {
            browserA: {
                'tb:options': {
                    build: 'unit-test',
                }
            } as any,
            browserB: {
                'tb:options': {
                    build: 'other-unit-test',
                }
            } as any
        }
        const tbLauncher = new TestingBotLauncher(options)

        await tbLauncher.onPrepare(config, caps as any)
        expect(caps).toEqual({
            browserA: {
                'tb:options': {
                    'tunnel-identifier': 'my-tunnel',
                    build: 'unit-test',
                }
            },
            browserB: {
                'tb:options': {
                    'tunnel-identifier': 'my-tunnel',
                    build: 'other-unit-test',
                }
            }
        })
    })

    it('should add tunnelIdentifier in tb:options', async () => {
        const options: TestingbotOptions = {
            tbTunnel: true,
            tbTunnelOpts: {
                apiKey: 'user',
                apiSecret: 'key',
            }
        }
        const config: any = {
            user: 'user',
            key: 'key'
        }
        const caps = [{
            'tb:options': {
                build: 'unit-test',
            }
        }] as any
        const tbLauncher = new TestingBotLauncher(options)

        await tbLauncher.onPrepare(config, caps)
        expect(Object.keys(caps[0]['tb:options'])).toContain('tunnel-identifier')
        expect(Object.keys(caps[0]['tb:options'])).toContain('build')
    })

    it('should add tunnelIdentifier in tb:options using multiremote', async () => {
        const options: TestingbotOptions = {
            tbTunnel: true,
            tbTunnelOpts: {
                apiKey: 'user',
                apiSecret: 'key',
            }
        }
        const config: any = {
            user: 'user',
            key: 'key'
        }
        const caps = {
            browserA: {},
            browserB: {
                'tb:options': {
                    build: 'other-unit-test',
                }
            }
        }
        const tbLauncher = new TestingBotLauncher(options)

        await tbLauncher.onPrepare(config, caps as any)
        expect(Object.keys(caps.browserA['tb:options'])).toContain('tunnel-identifier')
        expect(Object.keys(caps.browserB['tb:options'])).toContain('build')
    })

    it('onComplete', () => {
        const tbLauncher = new TestingBotLauncher({})
        tbLauncher.tunnel = {
            close: (resolve: any) => resolve('tunnel closed')
        }

        return expect(tbLauncher.onComplete()).resolves.toEqual('tunnel closed')
    })

    it('onComplete: no tunnel', () => {
        const tbLauncher = new TestingBotLauncher({})
        tbLauncher.tunnel = undefined
        expect(tbLauncher.onComplete()).toBeUndefined()
    })
})
