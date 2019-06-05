import CrossBrowserTestingLauncher from '../src/launcher'
import 'cbt_tunnels'

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
        expect(cbtLauncher.onPrepare(config)).resolves.toBe('connected')
            .then(() => expect(cbtLauncher.cbtTunnel.start).toHaveBeenCalled())
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
        cbtLauncher.cbtTunnel.start.mockImplementationOnce((options, cb) => cb(error))
        expect(cbtLauncher.onPrepare(config)).rejects.toThrow(error)
            .then(() => expect(cbtLauncher.cbtTunnel.start).toHaveBeenCalled())

    })

    it('onComplete: no tunnel', () => {
        cbtLauncher.tunnel = undefined
        expect(cbtLauncher.onComplete()).toBeUndefined()
    })

    it('onComplete: cbtTunnel.stop throws an error', () => {
        cbtLauncher.tunnel = true
        cbtLauncher.cbtTunnel.stop.mockImplementationOnce((cb) => cb(error))
        expect(cbtLauncher.onComplete()).rejects.toThrow(error)
            .then(() => expect(cbtLauncher.cbtTunnel.stop).toHaveBeenCalled())
    })

    it('onComplete: cbtTunnel.stop succesful', async () => {
        cbtLauncher.tunnel = true
        expect(cbtLauncher.onComplete()).resolves.toBe('stopped')
            .then(() => expect(cbtLauncher.cbtTunnel.stop).toHaveBeenCalled())
    })
})
