import path from 'node:path'
import type { MockedFunction } from 'vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import logger from '@wdio/logger'
import type { Options, Services } from '@wdio/types'

import { initializeLauncherService, initializeWorkerService } from '../src/initializeServices.js'
import { safeImport } from '../src/utils.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../src/utils.js', async (importActual) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const actual = await importActual<typeof import('../src/utils.js')>()
    return {
        ...actual,
        safeImport: vi.fn(),
        isAbsolute: vi.fn().mockReturnValue(true) }
})
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
            .rejects.toThrow(/Failed to initialise launcher service "borked": Error: ups/)
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
        )).rejects.toThrow(/Failed to initialise service borked: Error: ups/)
    })
})

describe('service activation', () => {
    describe('shouldLoad', () => {
        it.each([
            ['synchronous false', () => false, false],
            ['asynchronous false', async () => false, false],
            ['synchronous true', () => true, true],
            ['asynchronous true', async () => true, true],
            ['no explicit decision', () => undefined, true]
        ] as const)('handles %s without disabling the launcher', async (_name, predicate, enabled) => {
            const shouldLoad = vi.fn(predicate)
            const launcherConstructor = vi.fn()
            const workerConstructor = vi.fn()
            vi.mocked(safeImport).mockResolvedValue({
                shouldLoad,
                launcher: class {
                    constructor (...args: unknown[]) {
                        launcherConstructor(...args)
                    }
                },
                default: class {
                    constructor (...args: unknown[]) {
                        workerConstructor(...args)
                    }
                }
            } as any)
            const options = { endpoint: 'http://localhost:4444' }
            const config = { services: [['conditional', options]], baseUrl: 'http://localhost' } as WebdriverIO.Config
            const caps = [{ browserName: 'chrome' }, { browserName: 'firefox' }]

            const { launcherServices, ignoredWorkerServices } = await initializeLauncherService(config, caps)

            expect(shouldLoad).toHaveBeenCalledExactlyOnceWith(config, caps)
            expect(launcherServices).toHaveLength(1)
            expect(launcherConstructor).toHaveBeenCalledExactlyOnceWith(options, caps, config)
            expect(workerConstructor).not.toHaveBeenCalled()
            expect(ignoredWorkerServices).toEqual(enabled ? [] : ['conditional'])

            vi.mocked(safeImport).mockClear()
            const workerServices = await initializeWorkerService(config, caps[0], ignoredWorkerServices)
            expect(workerServices).toHaveLength(enabled ? 1 : 0)
            expect(safeImport).toHaveBeenCalledTimes(enabled ? 1 : 0)
            expect(workerConstructor).toHaveBeenCalledTimes(enabled ? 1 : 0)
            expect(shouldLoad).toHaveBeenCalledTimes(1)
        })

        it('uses one package-wide decision for duplicate service entries', async () => {
            const shouldLoad = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true)
            const launcherConstructor = vi.fn()
            vi.mocked(safeImport).mockResolvedValue({
                shouldLoad,
                launcher: class {
                    constructor (...args: unknown[]) {
                        launcherConstructor(...args)
                    }
                },
                default: class {}
            } as any)
            const firstOptions = { name: 'first' }
            const secondOptions = { name: 'second' }
            const config = { services: [['conditional', firstOptions], ['conditional', secondOptions]] } as WebdriverIO.Config
            const caps = [{ browserName: 'chrome' }]

            const { launcherServices, ignoredWorkerServices } = await initializeLauncherService(config, caps)

            expect(shouldLoad).toHaveBeenCalledExactlyOnceWith(config, caps)
            expect(launcherServices).toHaveLength(2)
            expect(launcherConstructor).toHaveBeenNthCalledWith(1, firstOptions, caps, config)
            expect(launcherConstructor).toHaveBeenNthCalledWith(2, secondOptions, caps, config)
            expect(ignoredWorkerServices).toEqual(['conditional'])

            vi.mocked(safeImport).mockClear()
            expect(await initializeWorkerService(config, caps[0], ignoredWorkerServices)).toEqual([])
            expect(safeImport).not.toHaveBeenCalled()
        })

        it('shares one package decision across aliases of the same imported module', async () => {
            const shouldLoad = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true)
            const serviceModule = { default: class {}, shouldLoad }
            vi.mocked(safeImport).mockResolvedValue(serviceModule as any)
            const config = { services: ['sauce', '@wdio/sauce-service'] }
            const caps = [{ browserName: 'chrome' }]

            const { ignoredWorkerServices } = await initializeLauncherService(config, caps)

            expect(shouldLoad).toHaveBeenCalledExactlyOnceWith(config, caps)
            expect(ignoredWorkerServices).toEqual(['sauce', '@wdio/sauce-service'])

            vi.mocked(safeImport).mockClear()
            expect(await initializeWorkerService(config, caps[0], ignoredWorkerServices)).toEqual([])
            expect(safeImport).not.toHaveBeenCalled()
        })

        it('keeps package decisions independent and reevaluates them for each launcher', async () => {
            const firstShouldLoad = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true)
            const secondShouldLoad = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false)
            const packages = {
                first: { default: class {}, shouldLoad: firstShouldLoad },
                second: { default: class {}, shouldLoad: secondShouldLoad }
            }
            vi.mocked(safeImport).mockImplementation(async (name) => packages[name as keyof typeof packages] as any)
            const config = { services: ['first', 'second'] }
            const caps = [{ browserName: 'chrome' }]

            const firstLaunch = await initializeLauncherService(config, caps)
            expect(firstLaunch.ignoredWorkerServices).toEqual(['first'])

            vi.mocked(safeImport).mockClear()
            const services = await initializeWorkerService(config, caps[0], firstLaunch.ignoredWorkerServices)
            expect(services).toHaveLength(1)
            expect(services[0]).toBeInstanceOf(packages.second.default)
            expect(safeImport).toHaveBeenCalledExactlyOnceWith('second')

            const secondLaunch = await initializeLauncherService(config, caps)
            expect(secondLaunch.ignoredWorkerServices).toEqual(['second'])
            expect(firstShouldLoad).toHaveBeenCalledTimes(2)
            expect(secondShouldLoad).toHaveBeenCalledTimes(2)
        })

        it.each([false, 'disabled', undefined])('ignores a nonfunction shouldLoad export (%s)', async (shouldLoad) => {
            vi.mocked(safeImport).mockResolvedValue({ default: class {}, shouldLoad } as any)

            expect(await initializeLauncherService({ services: ['conditional'] }, {})).toEqual({
                ignoredWorkerServices: [],
                launcherServices: []
            })
        })

        it('leaves worker shouldRun decisions out of launcher initialization', async () => {
            const shouldRun = vi.fn().mockReturnValue(false)
            vi.mocked(safeImport).mockResolvedValue({
                default: class {
                    static shouldRun = shouldRun
                },
                launcher: class {}
            } as any)

            const result = await initializeLauncherService({ services: ['conditional'] }, {})

            expect(result.launcherServices).toHaveLength(1)
            expect(result.ignoredWorkerServices).toEqual([])
            expect(shouldRun).not.toHaveBeenCalled()
        })

        it.each([
            ['throws', () => { throw new Error('activation failed') }],
            ['rejects', async () => { throw new Error('activation failed') }]
        ] as const)('identifies the package when shouldLoad %s', async (_name, shouldLoad) => {
            vi.mocked(safeImport).mockResolvedValue({ default: class {}, shouldLoad } as any)

            await expect(initializeLauncherService({ services: ['conditional'] }, {}))
                .rejects.toThrow(/Failed to initialise launcher service "conditional": Error: activation failed/)
        })
    })

    describe.each(['package default', 'CommonJS export', 'custom class'] as const)('shouldRun on a %s', (serviceType) => {
        it.each([
            ['synchronous false', () => false, false],
            ['asynchronous false', async () => false, false],
            ['synchronous true', () => true, true],
            ['asynchronous true', async () => true, true],
            ['no explicit decision', () => undefined, true],
            ['absent predicate', undefined, true]
        ] as const)('handles %s before constructing the worker service', async (_name, predicate, enabled) => {
            const shouldRun = predicate && vi.fn(predicate)
            const constructor = vi.fn()
            class ConditionalService {
                constructor (...args: unknown[]) {
                    constructor(...args)
                }

                before () {}
            }
            if (shouldRun) {
                Object.assign(ConditionalService, { shouldRun })
            }
            vi.mocked(safeImport).mockResolvedValue(
                (serviceType === 'package default' ? { default: ConditionalService } : ConditionalService) as any
            )
            const service = serviceType === 'custom class' ? ConditionalService : 'conditional'
            const options = { endpoint: 'http://localhost:4444' }
            const config = { services: [[service, options]], baseUrl: 'http://localhost' } as WebdriverIO.Config
            const caps = { browserName: 'firefox' }

            const services = await initializeWorkerService(config, caps)

            expect(services).toHaveLength(enabled ? 1 : 0)
            if (shouldRun) {
                expect(shouldRun).toHaveBeenCalledExactlyOnceWith(options, caps, config)
            }
            if (enabled) {
                expect(services[0]).toBeInstanceOf(ConditionalService)
                expect(constructor).toHaveBeenCalledExactlyOnceWith(options, caps, config)
            } else {
                expect(constructor).not.toHaveBeenCalled()
            }
            expect(safeImport).toHaveBeenCalledTimes(serviceType === 'custom class' ? 0 : 1)
        })

        it.each([
            ['throws', () => { throw new Error('activation failed') }],
            ['rejects', async () => { throw new Error('activation failed') }]
        ] as const)('identifies the service when shouldRun %s', async (_name, shouldRun) => {
            class ConditionalService {
                static shouldRun = shouldRun
                before () {}
            }
            vi.mocked(safeImport).mockResolvedValue(
                (serviceType === 'package default' ? { default: ConditionalService } : ConditionalService) as any
            )
            const service = serviceType === 'custom class' ? ConditionalService : 'conditional'
            const config = { services: [service] } as WebdriverIO.Config
            const label = serviceType === 'custom class' ? 'ConditionalService' : 'conditional'

            await expect(initializeWorkerService(config, {}))
                .rejects.toThrow(`Failed to initialise service ${label}: Error: activation failed`)
        })
    })

    it('evaluates shouldRun separately for each worker capability', async () => {
        const shouldRun = vi.fn((_options, caps: WebdriverIO.Capabilities) => caps.browserName === 'chrome')
        const constructor = vi.fn()
        class ConditionalService {
            static shouldRun = shouldRun
            constructor (...args: unknown[]) {
                constructor(...args)
            }
        }
        vi.mocked(safeImport).mockResolvedValue({ default: ConditionalService } as any)
        const options = { endpoint: 'http://localhost:4444' }
        const config = { services: [['conditional', options]] } as WebdriverIO.Config
        const firefox = { browserName: 'firefox' }
        const chrome = { browserName: 'chrome' }

        expect(await initializeWorkerService(config, firefox)).toEqual([])
        expect(await initializeWorkerService(config, chrome)).toHaveLength(1)

        expect(shouldRun).toHaveBeenCalledTimes(2)
        expect(shouldRun).toHaveBeenNthCalledWith(1, options, firefox, config)
        expect(shouldRun).toHaveBeenNthCalledWith(2, options, chrome, config)
        expect(constructor).toHaveBeenCalledExactlyOnceWith(options, chrome, config)
    })

    it.each([false, 'disabled'])('ignores a nonfunction shouldRun property (%s)', async (shouldRun) => {
        const Service = Object.assign(class {}, { shouldRun })
        vi.mocked(safeImport).mockResolvedValue({ default: Service } as any)

        const services = await initializeWorkerService({ services: ['conditional'] }, {})

        expect(services).toHaveLength(1)
        expect(services[0]).toBeInstanceOf(Service)
    })

    it('preserves preinitialized service objects without calling activation properties', async () => {
        const service = { before: vi.fn(), shouldLoad: vi.fn(), shouldRun: vi.fn() }
        const config = { services: [service] }

        const { launcherServices, ignoredWorkerServices } = await initializeLauncherService(config, {})
        const workerServices = await initializeWorkerService(config, {}, ignoredWorkerServices)

        expect(launcherServices).toEqual([service])
        expect(workerServices).toEqual([service])
        expect(launcherServices[0]).toBe(service)
        expect(workerServices[0]).toBe(service)
        expect(service.shouldLoad).not.toHaveBeenCalled()
        expect(service.shouldRun).not.toHaveBeenCalled()
        expect(safeImport).not.toHaveBeenCalled()
    })
})
