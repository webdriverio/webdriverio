import TestingBotLauncher from '../src/launcher'

describe('wdio-testingbot-service', () => {
    const tbLauncher = new TestingBotLauncher({})
    const execute = jest.fn()
    global.browser = {
        execute,
        sessionId: 'globalSessionId',
        requestHandler: {
            auth: {
                user: 'user',
                pass: 'pass'
            }
        }
    }

    afterEach(() => execute.mockReset())

    it('onPrepare: tbTunnel is undefined', () => {
        const config = {
            tbTunnel: undefined
        }

        tbLauncher.onPrepare(config)
        expect(tbLauncher.tbTunnelOpts).toBeUndefined()
        expect(tbLauncher.tunnel).toBeUndefined()
        expect(config.protocol).toBeUndefined()
        expect(config.hostname).toBeUndefined()
        expect(config.port).toBeUndefined()
    })

    it('onPrepare', () => {
        const config = {
            tbTunnel: {},
            tbTunnelOpts: {
                options: 'some options'
            },
            user: 'user',
            key: 'key'
        }

        tbLauncher.onPrepare(config)
        expect(tbLauncher.tbTunnelOpts).toEqual({ apiKey: 'user', apiSecret: 'key', options: 'some options' })
        expect(config.protocol).toEqual('http')
        expect(config.hostname).toEqual('localhost')
        expect(config.port).toEqual(4445)
    })

    it('onComplete', () => {
        tbLauncher.tunnel = {
            close: resolve => resolve('tunnel closed')
        }

        return expect(tbLauncher.onComplete()).resolves.toEqual('tunnel closed')
    })

    it('onComplete: no tunnel', () => {
        tbLauncher.tunnel = undefined
        expect(tbLauncher.onComplete()).toBeUndefined()
    })
})
