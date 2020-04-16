import logger from '@wdio/logger'

import TestingBotLauncher from '../src/launcher'

const log = logger()

describe('wdio-testingbot-service', () => {
    const execute = jest.fn()

    beforeEach(() => {
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
    })

    afterEach(() => {
        delete global.browser
        execute.mockReset()
    })

    it('onPrepare: tbTunnel is undefined', async () => {
        const options = { tbTunnel: undefined }
        const tbLauncher = new TestingBotLauncher(options)

        await tbLauncher.onPrepare({})
        expect(tbLauncher.tbTunnelOpts).toBeUndefined()
        expect(tbLauncher.tunnel).toBeUndefined()
        expect(options.protocol).toBeUndefined()
        expect(options.hostname).toBeUndefined()
        expect(options.port).toBeUndefined()
        expect(options.path).toBeUndefined()
    })

    it('onPrepare', async () => {
        const options = {
            tbTunnel: {},
            tbTunnelOpts: {
                options: 'some options'
            }
        }
        const config = {
            user: 'user',
            key: 'key'
        }
        const tbLauncher = new TestingBotLauncher(options, [], config)

        await tbLauncher.onPrepare(config)
        expect(tbLauncher.tbTunnelOpts).toEqual({ apiKey: 'user', apiSecret: 'key', options: 'some options' })
        expect(config.protocol).toEqual('http')
        expect(config.hostname).toEqual('localhost')
        expect(config.port).toEqual(4445)
        expect(config.path).toEqual('/wd/hub')
        expect(log.info.mock.calls[0][0]).toContain('TestingBot tunnel successfully started after')
    })

    it('onComplete', () => {
        const tbLauncher = new TestingBotLauncher({})
        tbLauncher.tunnel = {
            close: resolve => resolve('tunnel closed')
        }

        return expect(tbLauncher.onComplete()).resolves.toEqual('tunnel closed')
    })

    it('onComplete: no tunnel', () => {
        const tbLauncher = new TestingBotLauncher({})
        tbLauncher.tunnel = undefined
        expect(tbLauncher.onComplete()).toBeUndefined()
    })
})
