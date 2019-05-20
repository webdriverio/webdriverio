import CrossBrowserTestingLauncher from '../src/launcher'

describe('wdio-crossbrowsertesting-service', () => {
    const cbtLauncher = new CrossBrowserTestingLauncher({})
    const execute = jest.fn()
    global.browser = {
        execute,
        sessionId: 'globalSessionId',
        requestHandler: {
            auth: {
                user: 'test',
                key: 'testy'
            }
        }
    }

    afterEach(() => execute.mockReset())

    it('onPrepare: cbtTunnel is undefined', () => {
        const config = {
            cbtTunnel: undefined
        }

        cbtLauncher.onPrepare(config)
        expect(cbtLauncher.cbtTunnelOpts).toBeUndefined()
        expect(cbtLauncher.cbtTunnel).toBeUndefined()
    })

    it('onPrepare', () => {
        const config = {
            cbtTunnel: {},
            cbtTunnelOpts: {
                options: 'some options'
            },
            user: 'test',
            key: 'testy'
        }

        cbtLauncher.onPrepare(config)
        expect(cbtLauncher.cbtTunnelOpts).toEqual({ username: 'test', authkey: 'testy', options: 'some options' })
    })

    it('onComplete: no tunnel', () => {
        cbtLauncher.tunnel = undefined
        expect(cbtLauncher.onComplete()).toBeUndefined()
    })

    it('onComplete', async () => {
        return expect(await cbtLauncher.onComplete())
    })
})
