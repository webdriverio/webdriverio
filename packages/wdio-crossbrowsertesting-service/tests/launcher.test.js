import cbtTunnels from 'cbt_tunnels'
import logger from '@wdio/logger'

import CrossBrowserTestingLauncher from '../src/launcher'

const error = new Error('Error!')

describe('wdio-crossbrowsertesting-service', () => {
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

    it('onPrepare: cbtTunnel is undefined', async () => {
        const cbtLauncher = new CrossBrowserTestingLauncher({
            cbtTunnel: undefined
        })

        await cbtLauncher.onPrepare()
        expect(cbtLauncher.cbtTunnelOpts).toBeUndefined()
        expect(cbtLauncher.cbtTunnel).toBeUndefined()
    })

    it('onPrepare: cbtTunnel.start successful', async () => {
        const cbtLauncher = new CrossBrowserTestingLauncher({
            cbtTunnel: {},
            cbtTunnelOpts: {
                options: 'some options'
            }
        }, [{}], {
            user: 'test',
            key: 'testy'
        })
        await cbtLauncher.onPrepare()
        expect(cbtTunnels.start).toHaveBeenCalledWith({ username: 'test', authkey: 'testy', nokill: true, options: 'some options' }, expect.any(Function))
        expect(cbtLauncher.cbtTunnelOpts).toEqual({ username: 'test', authkey: 'testy', nokill: true, options: 'some options' })
        expect(logger().info.mock.calls[0][0]).toContain('CrossBrowserTesting tunnel successfully started after')

    })

    it('onPrepare: cbtTunnel.start throws an error', () => {
        const cbtLauncher = new CrossBrowserTestingLauncher({
            cbtTunnel: {},
            cbtTunnelOpts: {
                options: 'some options'
            }
        }, [{}], {
            user: 'test',
            key: 'testy'
        })
        cbtTunnels.start.mockImplementationOnce((options, cb) => cb(error))
        expect(cbtLauncher.onPrepare()).rejects.toThrow(error)
            .then(() => expect(cbtTunnels.start).toHaveBeenCalled())

    })

    it('onComplete: no tunnel', () => {
        const cbtLauncher = new CrossBrowserTestingLauncher({}, [{}], {})
        cbtLauncher.tunnel = undefined
        expect(cbtLauncher.onComplete()).toBeUndefined()
    })

    it('onComplete: cbtTunnel.stop throws an error', () => {
        const cbtLauncher = new CrossBrowserTestingLauncher({}, [{}], {})
        cbtLauncher.tunnel = true
        cbtTunnels.stop.mockImplementationOnce((cb) => cb(error))
        expect(cbtLauncher.onComplete()).rejects.toThrow(error)
            .then(() => expect(cbtTunnels.stop).toHaveBeenCalled())
    })

    it('onComplete: cbtTunnel.stop successful', async () => {
        const cbtLauncher = new CrossBrowserTestingLauncher({}, [{}], {})
        cbtLauncher.tunnel = true
        expect(cbtLauncher.onComplete()).resolves.toBe('stopped')
            .then(() => expect(cbtTunnels.stop).toHaveBeenCalled())
    })
})
