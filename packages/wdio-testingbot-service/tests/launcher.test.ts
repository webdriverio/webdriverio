import logger from '@wdio/logger'

import TestingBotLauncher from '../src/launcher'

const log = logger('')

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
        } as any
    })

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
                options: 'some options'
            }
        }
        const config: any = {
            user: 'user',
            key: 'key'
        }
        const caps = {} as any
        const tbLauncher = new TestingBotLauncher(options)

        await tbLauncher.onPrepare(config, caps)
        expect(tbLauncher.tbTunnelOpts).toMatchObject({ apiKey: 'user', apiSecret: 'key', options: 'some options' })
        expect((log.info as jest.Mock).mock.calls[0][0]).toContain('TestingBot tunnel successfully started after')
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
