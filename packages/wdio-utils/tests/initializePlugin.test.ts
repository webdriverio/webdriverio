import { describe, it, expect, vi } from 'vitest'
import type { Services } from '@wdio/types'

import initializePlugin from '../src/initializePlugin.js'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { resolve } from 'import-meta-resolve'

interface TestService extends Services.ServiceInstance {
    foo: string
    isScoped: boolean
}

vi.mock('import-meta-resolve', ()=>({
    resolve: vi.fn()
}))

const __dirname = (path.dirname(fileURLToPath(import.meta.url)))
const fixtureDir = path.resolve(__dirname, path.join('__fixtures__', 'plugins'))

function createMockResolver(specifier:string, result:string) {
    const filepath = path.resolve(fixtureDir, result)
    return function(_specifier:string, _result:string){
        if (_specifier === specifier){
            return pathToFileURL(filepath).href
        }
        throw new Error(`Unexpected specifier: ${_specifier}`)
    }
}

describe('initializePlugin', () => {
    it('should allow to load scoped service plugin', async ()=>{
        vi.mocked(resolve).mockImplementation(
            createMockResolver('@custom/foo-service', 'foo-service.js')
        )

        const { default: Service } = await initializePlugin('@custom/foo-service', 'service')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('foo')
    })

    it('should allow to load the service specified by absolute path', async ()=>{
        const servicePath = path.resolve(__dirname, 'foo-service.js')
        vi.mocked(resolve).mockImplementation(
            createMockResolver(pathToFileURL(servicePath).href, path.basename(servicePath))
        )

        const { default: Service } = await initializePlugin(servicePath, 'service')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('foo')
    })

    it('should allow to load a scoped service plugin', async ()=>{
        const name = 'foo'
        const type = 'service'
        vi.mocked(resolve).mockImplementation(
            createMockResolver(`@wdio/${name.toLowerCase()}-${type}`, 'foo-service.js')
        )

        const { default: Service } = await initializePlugin(name, type)
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('foo')
    })

    it('should allow to load a unscoped service plugin from wdio', async ()=>{
        const name = 'foo'
        const type = 'service'
        vi.mocked(resolve).mockImplementation(
            createMockResolver(`wdio-${name.toLowerCase()}-${type}`, 'foo-service.js')
        )

        const { default: Service } = await initializePlugin(name, type)
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('foo')
    })

    it('should prefer scoped over unscoped packages', async ()=>{
        const name = 'foo'
        const type = 'service'
        vi.mocked(resolve).mockImplementation(
            (specifier:string, _parent:string)=>{
                switch (specifier) {
                case `wdio-${name.toLowerCase()}-${type}`:
                    return pathToFileURL( path.resolve(fixtureDir, 'foo-service.js')).href
                case `@wdio/${name.toLowerCase()}-${type}`:
                    return pathToFileURL( path.resolve(fixtureDir, 'bar-service.js')).href
                default:
                    throw new Error(`Unexpected specifier: ${specifier}`)
                }
            }
        )

        const { default: Service } = await initializePlugin(name, type)
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('bar')
    })

    it('should throw meaningful error message', async () => {
        const name = 'borked'
        const type = 'framework'
        vi.mocked(resolve).mockImplementation(
            createMockResolver(`@wdio/${name.toLowerCase()}-${type}`, 'NOT_FOUND')
        )

        await expect(() => initializePlugin('lala', 'service')).rejects
            .toThrow(/Please make sure you have it installed!/)
        await expect(() => initializePlugin(name, type)).rejects
            .toThrow(/Couldn't initialize "@wdio\/borked-framework"/)
        await expect(() => initializePlugin('foobar')).rejects
            .toThrow(/No plugin type provided/)
    })
})
