import path from 'node:path'
import { describe, expect, it, afterEach, vi } from 'vitest'
import cbtTunnels from 'cbt_tunnels'
import logger from '@wdio/logger'
import { Capabilities, Options } from '@wdio/types'

import CrossBrowserTestingLauncher from '../src/launcher'
import { CrossBrowserTestingConfig } from '../src/types'

vi.mock('cbt_tunnels')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const error = new Error('Error!')

describe('wdio-crossbrowsertesting-service', () => {
    const execute = vi.fn()
    afterEach(() => {
        execute.mockReset()
    })

    it('onPrepare: cbtTunnel is undefined', async () => {
        const options = { cbtTunnel: undefined } as any
        const caps: Capabilities.DesiredCapabilities = {}
        const config = {
            user: 'test',
            key: 'key'
        } as Options.Testrunner

        const cbtLauncher = new CrossBrowserTestingLauncher(options, caps, config)

        await cbtLauncher.onPrepare()
        expect(cbtLauncher['_cbtTunnelOpts']).toEqual({
            authkey: 'key',
            nokill: true,
            username: 'test'
        })
        expect((cbtLauncher as any).cbtTunnel).toBeUndefined()
    })

    it('onPrepare: cbtTunnel.start successful', async () => {
        const options: CrossBrowserTestingConfig = {
            cbtTunnel: true,
            cbtTunnelOpts: {
                options: 'some options'
            }
        }
        const cbtLauncher = new CrossBrowserTestingLauncher(options, [{}] as Capabilities.DesiredCapabilities, {
            user: 'test',
            key: 'testy'
        } as any)
        await cbtLauncher.onPrepare()
        expect(cbtTunnels.start).toHaveBeenCalledWith({ username: 'test', authkey: 'testy', nokill: true, options: 'some options' }, expect.any(Function))
        expect(cbtLauncher['_cbtTunnelOpts']).toEqual({ username: 'test', authkey: 'testy', nokill: true, options: 'some options' })
        await new Promise((resolve) => setTimeout(resolve, 100))
        expect(vi.mocked(logger('').info).mock.calls[0][0]).toContain('CrossBrowserTesting tunnel successfully started after')

    })

    it('onPrepare: cbtTunnel.start throws an error', () => {
        const options: CrossBrowserTestingConfig = {
            cbtTunnel: true,
            cbtTunnelOpts: {
                options: 'some options'
            }
        }
        const cbtLauncher = new CrossBrowserTestingLauncher(options, [{}] as Capabilities.DesiredCapabilities, {
            user: 'test',
            key: 'testy'
        } as any);
        vi.mocked(cbtTunnels.start).mockImplementationOnce((options: never, cb: any) => cb(error))
        expect(cbtLauncher.onPrepare()).rejects.toThrow(error)
            .then(() => expect(cbtTunnels.start).toHaveBeenCalled())

    })

    it('onComplete: no tunnel', () => {
        const cbtLauncher = new CrossBrowserTestingLauncher({}, [{}] as Capabilities.DesiredCapabilities, {} as any)
        cbtLauncher['_isUsingTunnel'] = false
        expect(cbtLauncher.onComplete()).toBeUndefined()
    })

    it('onComplete: cbtTunnel.stop throws an error', () => {
        const cbtLauncher = new CrossBrowserTestingLauncher({} as any, [{}] as Capabilities.DesiredCapabilities, {} as any)
        cbtLauncher['_isUsingTunnel'] = true;
        vi.mocked(cbtTunnels.stop).mockImplementationOnce((cb: any) => cb(error))
        expect(cbtLauncher.onComplete()).rejects.toThrow(error)
            .then(() => expect(cbtTunnels.stop).toHaveBeenCalled())
    })

    it('onComplete: cbtTunnel.stop successful', async () => {
        const cbtLauncher = new CrossBrowserTestingLauncher({} as any, [{}] as Capabilities.DesiredCapabilities, {} as any)
        cbtLauncher['_isUsingTunnel'] = true
        expect(cbtLauncher.onComplete()).resolves.toBe('stopped')
            .then(() => expect(cbtTunnels.stop).toHaveBeenCalled())
    })
})
