import { describe, it, expect, vi } from 'vitest'
import type { Services } from '@wdio/types'

import initializePlugin from '../src/initializePlugin.js'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

interface TestService extends Services.ServiceInstance {
    foo: string
    isScoped: boolean
}

vi.mock('import-meta-resolve', ()=>{
    const createMockUrl = function(filename:string){
        const filepath = path.resolve(`${process.cwd()}/__mocks__/@saucelabs/${filename}`)
        return pathToFileURL(filepath)
    }
    return {
        resolve:vi.fn((specifier: string, parent: string)=>{
            const reporter = createMockUrl('wdio-foobar-reporter.js')
            switch (specifier) {
            case '@wdio/foobar-service':
            case '@wdio/scoped-service':
                return createMockUrl('wdio-foobar-service.js')
            case 'wdio-test-service':
            case 'wdio-scoped-service':
                return createMockUrl('wdio-bar-service.js')
            case '@saucelabs/wdio-foobar-reporter':
            case reporter.href:
                return reporter
            case 'wdio-test-reporter':
                return createMockUrl('wdio-bar-reporter.js')
            case '@wdio/borked-framework':
                return 'not found'
            default:
                throw new Error('Not found')
            }

        }),
    }
})

describe('initializePlugin', () => {
    it('should allow to load a scoped service plugin', async () => {
        const { default: Service } = await initializePlugin('foobar', 'service')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('foobar')
    })

    it('should allow to load unscoped service plugin from wdio', async () => {
        const { default: Service }  = await initializePlugin('@wdio/foobar-service', 'service')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('foobar')
    })

    it('should allow to load unscoped service plugin', async () => {
        const { default: Service } = await initializePlugin('test', 'service')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('bar')
    })

    it('should allow to load scoped reporter', async () => {
        const { default: Service } = await initializePlugin('@saucelabs/wdio-foobar-reporter', 'reporter')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('foobar')
    })

    it('should allow to load reporter referenced with an absolute path', async () => {
        const { default: Service } = await initializePlugin(process.cwd() + '/__mocks__/@saucelabs/wdio-foobar-reporter.js')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('foobar')
    })

    it('should prefer scoped over unscoped packages', async () => {
        const { default: Service } = await initializePlugin('scoped', 'service')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.isScoped).toBe(true)
    })

    it('should throw meaningful error message', async () => {
        await expect(() => initializePlugin('lala', 'service')).rejects
            .toThrow(/Please make sure you have it installed!/)
        await expect(() => initializePlugin('borked', 'framework')).rejects
            .toThrow(/Couldn't initialize "@wdio\/borked-framework"/)
        await expect(() => initializePlugin('foobar')).rejects
            .toThrow(/No plugin type provided/)
    })
})
