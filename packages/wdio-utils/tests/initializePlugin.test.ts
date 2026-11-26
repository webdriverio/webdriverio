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

    it('should allow to load a plugin from an absolute path with URL-reserved characters', async () => {
        const pluginPath = path.resolve(fixtureDir, 'plugin%fixture.mjs')

        vi.mocked(resolve).mockImplementation(
            createMockResolver(pathToFileURL(pluginPath).href, path.basename(pluginPath))
        )

        const { default: Service } = await initializePlugin(pluginPath, 'service')
        const service = new Service({} as any, {}, {}) as TestService

        expect(service.foo).toBe('percent')
    })

    it('should preserve Windows paths on all operating systems', async () => {
        const pluginPath = 'C:\\plugins\\plugin%fixture.mjs'

        vi.mocked(resolve).mockImplementation(
            createMockResolver('file:///C:/plugins/plugin%25fixture.mjs', 'plugin%fixture.mjs')
        )

        const { default: Service } = await initializePlugin(pluginPath, 'service')
        const service = new Service({} as any, {}, {}) as TestService

        expect(service.foo).toBe('percent')
    })

    it('should allow to load a plugin specified as file:// URL', async () => {
        const serviceUrl = pathToFileURL(path.resolve(fixtureDir, 'foo-service.js')).href

        vi.mocked(resolve).mockImplementation(
            createMockResolver(serviceUrl, 'foo-service.js')
        )

        const { default: Service } = await initializePlugin(serviceUrl, 'service')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('foo')
    })

    it('should not treat a file:// URL plugin name as a package name', async () => {
        const serviceUrl = pathToFileURL(path.resolve(fixtureDir, 'bar-service.js')).href
        const specifiers: string[] = []

        vi.mocked(resolve).mockImplementation((specifier: string) => {
            specifiers.push(specifier)
            if (specifier === serviceUrl) {
                return serviceUrl
            }
            throw new Error(`Unexpected specifier: ${specifier}`)
        })

        const { default: Service } = await initializePlugin(serviceUrl, 'service')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('bar')
        expect(specifiers).toEqual([serviceUrl])
    })

    it.each([
        ['single-slash file:/ URL', (canonical: string) => canonical.replace('file:///', 'file:/')],
        ['uppercase FILE:/// URL', (canonical: string) => canonical.replace('file:', 'FILE:')],
        ['uppercase single-slash FILE:/ URL', (canonical: string) => canonical.replace('file:///', 'FILE:/')],
        ['localhost file://localhost/ URL', (canonical: string) => canonical.replace('file:///', 'file://localhost/')],
    ])('should load a plugin specified as %s without package fallback', async (_label, toVariant) => {
        const canonicalUrl = pathToFileURL(path.resolve(fixtureDir, 'foo-service.js')).href
        const variantUrl = toVariant(canonicalUrl)
        const specifiers: string[] = []

        vi.mocked(resolve).mockImplementation((specifier: string) => {
            specifiers.push(specifier)
            if (specifier === canonicalUrl) {
                return canonicalUrl
            }
            throw new Error(`Unexpected specifier: ${specifier}`)
        })

        const { default: Service } = await initializePlugin(variantUrl, 'service')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('foo')
        expect(specifiers).toEqual([canonicalUrl])
    })

    it('should load a file:/ URL plugin without requiring a plugin type', async () => {
        const canonicalUrl = pathToFileURL(path.resolve(fixtureDir, 'bar-service.js')).href
        const singleSlashUrl = canonicalUrl.replace('file:///', 'file:/')

        vi.mocked(resolve).mockImplementation(
            createMockResolver(canonicalUrl, 'bar-service.js')
        )

        const { default: Service } = await initializePlugin(singleSlashUrl)
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('bar')
    })

    it('should canonicalize Windows file:/ and FILE:/// URLs without double-encoding', async () => {
        const expectedUrl = 'file:///C:/plugins/plugin%25fixture.mjs'

        for (const variantUrl of [
            'file:/C:/plugins/plugin%25fixture.mjs',
            'FILE:///C:/plugins/plugin%25fixture.mjs',
        ]) {
            vi.mocked(resolve).mockImplementation(
                createMockResolver(expectedUrl, 'plugin%fixture.mjs')
            )

            const { default: Service } = await initializePlugin(variantUrl, 'service')
            const service = new Service({} as any, {}, {}) as TestService
            expect(service.foo).toBe('percent')
        }
    })

    it('should preserve query strings on non-canonical file URLs', async () => {
        const canonicalUrl = pathToFileURL(path.resolve(fixtureDir, 'foo-service.js')).href
        const expectedUrl = `${canonicalUrl}?v=1`
        const variantUrl = `${canonicalUrl.replace('file:///', 'file:/')}?v=1`

        vi.mocked(resolve).mockImplementation(
            createMockResolver(expectedUrl, 'foo-service.js')
        )

        const { default: Service } = await initializePlugin(variantUrl, 'service')
        const service = new Service({} as any, {}, {}) as TestService
        expect(service.foo).toBe('foo')
    })

    it('should not fall back to package resolution when a file URL fails to resolve', async () => {
        const unresolvableUrl = 'file://remote-host/share/plugin.mjs'
        const specifiers: string[] = []

        vi.mocked(resolve).mockImplementation((specifier: string) => {
            specifiers.push(specifier)
            throw new Error('ERR_INVALID_FILE_URL_HOST')
        })

        await expect(() => initializePlugin(unresolvableUrl, 'service')).rejects
            .toThrow(`Couldn't initialize "${unresolvableUrl}".`)
        expect(specifiers).toEqual([unresolvableUrl, unresolvableUrl])
    })

    it('should report a missing scoped plugin without treating it as a file URL', async () => {
        vi.mocked(resolve).mockImplementation(() => {
            throw new Error('ERR_MODULE_NOT_FOUND')
        })

        await expect(() => initializePlugin('@custom/missing-service', 'service')).rejects
            .toThrow(/Couldn't find plugin "@custom\/missing-service" service/)
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
