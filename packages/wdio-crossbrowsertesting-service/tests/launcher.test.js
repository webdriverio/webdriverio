import CrossBrowserTestingLauncher from '../src/launcher'
import cbtTunnels from 'cbt_tunnels'

/**
 * remove `beforeAll` and `tests/__mocks__/pac-resolver.js` file once issue is fixed
 */
beforeAll(() => {
    if (!global.PAC_RESOLVER_MOCK) {
        throw new Error('https://github.com/crossbrowsertesting/cbt-tunnel-nodejs/issues/25 has been fixed!')
    }
})

describe('wdio-crossbrowsertesting-service', () => {
    const cbtLauncher = new CrossBrowserTestingLauncher({})
    const error = new Error('Error!')
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

    it('onPrepare: cbtTunnel.start successful', async () => {
        const config = {
            cbtTunnel: {},
            cbtTunnelOpts: {
                options: 'some options'
            },
            user: 'test',
            key: 'testy'
        }
        await expect(cbtLauncher.onPrepare(config)).resolves.toBe('connected')
        expect(cbtTunnels.start).toHaveBeenCalledWith({ username: 'test', authkey: 'testy', options: 'some options' }, expect.any(Function))
        expect(cbtLauncher.cbtTunnelOpts).toEqual({ username: 'test', authkey: 'testy', options: 'some options' })

    })

    it('onPrepare: cbtTunnel.start throws an error', () => {
        const config = {
            cbtTunnel: {},
            cbtTunnelOpts: {
                options: 'some options'
            },
            user: 'test',
            key: 'testy'
        }
        cbtTunnels.start.mockImplementationOnce((options, cb) => cb(error))
        expect(cbtLauncher.onPrepare(config)).rejects.toThrow(error)
            .then(() => expect(cbtTunnels.start).toHaveBeenCalled())

    })

    it('onComplete: no tunnel', () => {
        cbtLauncher.tunnel = undefined
        expect(cbtLauncher.onComplete()).toBeUndefined()
    })

    it('onComplete: cbtTunnel.stop throws an error', () => {
        cbtLauncher.tunnel = true
        cbtTunnels.stop.mockImplementationOnce((cb) => cb(error))
        expect(cbtLauncher.onComplete()).rejects.toThrow(error)
            .then(() => expect(cbtTunnels.stop).toHaveBeenCalled())
    })

    it('onComplete: cbtTunnel.stop successful', async () => {
        cbtLauncher.tunnel = true
        expect(cbtLauncher.onComplete()).resolves.toBe('stopped')
            .then(() => expect(cbtTunnels.stop).toHaveBeenCalled())
    })
})
