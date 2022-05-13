import { describe, it, expect, vi } from 'vitest'
import type { Services } from '@wdio/types'

import initialisePlugin from '../src/initialisePlugin'

interface TestService extends Services.ServiceInstance {
    foo: string
    isScoped: boolean
}

vi.mock('@wdio/foobar-service')

/**
 * vitest can't load non existing packages
 * https://github.com/vitest-dev/vitest/pull/1298
 */
describe.skip('initialisePlugin', () => {
    it('should allow to load a scoped service plugin', async () => {
        const Service = await initialisePlugin('foobar', 'service')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('foobar')
    })

    it('should allow to load unscoped service plugin from wdio', async () => {
        const Service = await initialisePlugin('@wdio/foobar-service', 'service')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('foobar')
    })

    it('should allow to load unscoped service plugin', async () => {
        const Service = await initialisePlugin('test', 'service')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('bar')
    })

    it('should allow to load scoped services', async () => {
        const Service = await initialisePlugin('@saucelabs/wdio-foobar-reporter', 'reporter')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('barfoo')
    })

    it('should allow to load service referenced with an absolute path', async () => {
        const path = require.resolve(__dirname + '/__mocks__/@saucelabs/wdio-foobar-reporter')
        const Service = await initialisePlugin(path)
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('barfoo')
    })

    it('should prefer scoped over unscoped packages', async () => {
        const Service = await initialisePlugin('scoped', 'service')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.isScoped).toBe(true)
    })

    it('should throw meaningful error message', async () => {
        await expect(() => initialisePlugin('lala', 'service'))
            .toThrow(/Please make sure you have it installed!/)
        await expect(() => initialisePlugin('borked', 'framework'))
            .toThrow(/Error: foobar/)
        await expect(() => initialisePlugin('foobar'))
            .toThrow(/No plugin type provided/)
    })
})
