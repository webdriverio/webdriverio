import path from 'node:path'
import type { MockedFunction } from 'vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import logger from '@wdio/logger'
import type { Options, Services } from '@wdio/types'

import { initializeLauncherService, initializeWorkerService } from '../src/initializeServices.js'
import { safeImport } from '../src/utils.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../src/utils.js', () => ({
    safeImport: vi.fn(),
    isAbsolute: vi.fn().mockReturnValue(true)
}))
const log = logger('test')

interface TestLauncherService extends Services.ServiceInstance {
    isLauncher: boolean
}

class CustomService {
    options: Record<string, any>
    config: Options.Testrunner
    caps: WebdriverIO.Capabilities
    constructor (options: Record<string, any>, caps: WebdriverIO.Capabilities, config: Options.Testrunner) {
        this.options = options
        this.config = config
        this.caps = caps
    }

    onPrepare () {}
}

beforeEach(() => {
    (log.error as MockedFunction<any>).mockClear()
    vi.mocked(safeImport).mockClear()
})

describe('initializeLauncherService', () => {
    it('should return empty array if no services prop is given', async () => {
        expect(await initializeLauncherService({ services: [] }, {})).toEqual({
            ignoredWorkerServices: [],
            launcherServices: []
        })
    })

    it('should be able to add initialized services', async () => {
        const service = {
            before: vi.fn(),
            afterTest: vi.fn()
        }

        const {
            launcherServices,
            ignoredWorkerServices
        } = await initializeLauncherService({ services: [service] }, {})
        expect(ignoredWorkerServices).toHaveLength(0)
        expect(launcherServices).toHaveLength(1)
        expect(launcherServices[0]).toEqual(service)
    })

    it('should allow custom services without options', async () => {
        const {
            launcherServices,
            ignoredWorkerServices
        } = await initializeLauncherService(
            { services: [CustomService as Services.ServiceEntry], baseUrl: 'foobar' },
            {}
        )
        expect(ignoredWorkerServices).toHaveLength(0)
        expect(launcherServices).toHaveLength(1)
        expect((launcherServices as CustomService[])[0].config.baseUrl).toBe('foobar')
    })

    it('should allow custom services with options', async () => {
        const {
            launcherServices,
            ignoredWorkerServices
        } = await initializeLauncherService(
            { services: [[CustomService, { foo: 'foo' }] as Services.ServiceEntry], baseUrl: 'foobar' },
            {}
        )
        expect(ignoredWorkerServices).toHaveLength(0)
        expect(launcherServices).toHaveLength(1)
        expect((launcherServices as CustomService[])[0].options.foo).toBe('foo')
        expect((launcherServices as CustomService[])[0].config.baseUrl).toBe('foobar')
    })

    it('should allow custom services with empty options', async () => {
        const { launcherServices } = await initializeLauncherService(
            {
                services: [
                    [CustomService, {}] as Services.ServiceEntry
                ],
                baseUrl: 'foobar'
            },
            {}
        )
        expect(launcherServices).toHaveLength(1)
        expect((launcherServices as CustomService[])[0].config.baseUrl).toBe('foobar')
        expect((launcherServices as CustomService[])[0].options).toEqual({})
    })

    it('should propagate services that have launcher only capabilities', async () => {
        vi.mocked(safeImport).mockResolvedValue({
            launcher: class {
                isLauncher = true
            }
        } as any)
        const {
            launcherServices,
            ignoredWorkerServices
        } = await initializeLauncherService({ services: ['launcher-only'] }, {})
        expect(launcherServices).toHaveLength(1)
        expect((launcherServices[0] as TestLauncherService).isLauncher).toBe(true)
        expect(ignoredWorkerServices).toEqual(['launcher-only'])
    })

    it('should ignore worker services', async () => {
        vi.mocked(safeImport).mockResolvedValue({
            default: class {
                constructor () {
                    // @ts-ignore
                    globalThis.test = 'test'
                }
            }
        } as any)
        const {
            launcherServices,
            ignoredWorkerServices
        } = await initializeLauncherService({ services: ['scoped'] }, {})
        expect(launcherServices).toHaveLength(0)
        expect(ignoredWorkerServices).toHaveLength(0)
        expect(globalThis.test).toBe(undefined)
    })

    it('should not fail if service is borked', async () => {
        vi.mocked(safeImport).mockResolvedValue({
            launcher: class {
                constructor () {
                    throw new Error('ups')
                }
            }
        } as any)
        await expect(() => initializeLauncherService({ services: ['borked'] }, {}))
            .rejects.toThrow(/Failed to initilialise launcher service "borked": Error: ups/)
    })
})

describe('initializeWorkerService', () => {
    it('should return empty array if no services prop is given', async () => {
        expect(await initializeWorkerService({ services: [] } as any, {})).toEqual([])
    })

    it('should be able to add initialized services', async () => {
        const service = {
            before: vi.fn(),
            afterTest: vi.fn()
        }

        const services = await initializeWorkerService({ services: [service] } as any, {})
        expect(services).toHaveLength(1)
        expect(services[0]).toEqual(service)
    })

    it('should allow custom services without options', async () => {
        const services = await initializeWorkerService(
            { services: [CustomService], baseUrl: 'foobar' } as any,
            {}
        )
        expect(services).toHaveLength(1)
        expect((services as CustomService[])[0].config.baseUrl).toBe('foobar')
    })

    it('should allow custom services with options', async () => {
        const services = await initializeWorkerService(
            { services: [[CustomService, { foo: 'foo' }]], baseUrl: 'foobar' } as any,
            {}
        )
        expect(services).toHaveLength(1)
        expect((services as CustomService[])[0].options.foo).toBe('foo')
        expect((services as CustomService[])[0].config.baseUrl).toBe('foobar')
    })

    it('should ignore service with launcher only', async () => {
        vi.mocked(safeImport).mockResolvedValue({
            launcher: class {
                constructor () {
                    throw new Error('ups')
                }
            }
        } as any)
        const services = await initializeWorkerService(
            { services: ['launcher-only'] } as any,
            {}
        )
        expect(services).toHaveLength(0)
        expect(log.error).toHaveBeenCalledTimes(0)
    })

    it('should not fail if service is borked', async () => {
        vi.mocked(safeImport).mockResolvedValue({
            default: class {
                constructor () {
                    throw new Error('ups')
                }
            }
        } as any)
        await expect(initializeWorkerService(
            { services: ['borked'] } as any,
            {}
        )).rejects.toThrow(/Failed to initilialise service borked: Error: ups/)
    })
})
