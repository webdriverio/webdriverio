import { expectTypeOf, test } from 'vitest'
import type { Capabilities, Options, Services } from '@wdio/types'

type ShouldLoad = NonNullable<Services.ServicePlugin['shouldLoad']>
type ShouldRun = NonNullable<Services.ServiceClass['shouldRun']>

test('package activation receives launcher config and all capabilities', () => {
    const shouldLoad: ShouldLoad = (config, capabilities) => {
        expectTypeOf(config).toEqualTypeOf<Omit<Options.Testrunner, 'capabilities' | keyof Services.HookFunctions>>()
        expectTypeOf(capabilities).toEqualTypeOf<Capabilities.TestrunnerCapabilities>()
        return true
    }
    const shouldLoadAsync: ShouldLoad = async (config, capabilities) => shouldLoad(config, capabilities)

    class Service {
        before () {}
    }

    const syncPlugin = Object.assign(Service, { default: Service, shouldLoad })
    const asyncPlugin = Object.assign(Service, { default: Service, shouldLoad: shouldLoadAsync })

    expectTypeOf(syncPlugin).toExtend<Services.ServicePlugin>()
    expectTypeOf(asyncPlugin).toExtend<Services.ServicePlugin>()
    expectTypeOf<ShouldLoad>().returns.toEqualTypeOf<boolean | Promise<boolean>>()
})

test('worker activation is compatible with service constructors and typed arguments', () => {
    const shouldRun: ShouldRun = (options, capabilities, config) => {
        expectTypeOf(options).toEqualTypeOf<WebdriverIO.ServiceOption>()
        expectTypeOf(capabilities).toEqualTypeOf<Capabilities.ResolvedTestrunnerCapabilities>()
        expectTypeOf(config).toEqualTypeOf<Options.WebdriverIO>()
        return true
    }
    const shouldRunAsync: ShouldRun = async (options, capabilities, config) => shouldRun(options, capabilities, config)

    class Service {
        static shouldRun = shouldRun

        constructor (
            options: WebdriverIO.ServiceOption,
            capabilities: Capabilities.ResolvedTestrunnerCapabilities,
            config: Options.WebdriverIO
        ) {
            expectTypeOf(shouldRun).toBeCallableWith(options, capabilities, config)
        }

        before () {}
    }

    const asyncService = Object.assign(class { before () {} }, { shouldRun: shouldRunAsync })
    class LegacyService {
        before () {}
    }

    expectTypeOf(Service).toExtend<Services.ServiceClass>()
    expectTypeOf(asyncService).toExtend<Services.ServiceClass>()
    expectTypeOf(LegacyService).toExtend<Services.ServiceClass>()
    expectTypeOf<ShouldRun>().returns.toEqualTypeOf<boolean | Promise<boolean>>()
})

test('activation predicates require a boolean or a promise of boolean', () => {
    // @ts-expect-error package activation cannot return a string
    const invalidShouldLoad: ShouldLoad = () => 'enabled'
    // @ts-expect-error asynchronous package activation cannot return a number
    const invalidAsyncShouldLoad: ShouldLoad = async () => 1
    // @ts-expect-error worker activation cannot return a number
    const invalidShouldRun: ShouldRun = () => 1
    // @ts-expect-error asynchronous worker activation cannot return a string
    const invalidAsyncShouldRun: ShouldRun = async () => 'enabled'

    expectTypeOf(invalidShouldLoad).toEqualTypeOf<ShouldLoad>()
    expectTypeOf(invalidAsyncShouldLoad).toEqualTypeOf<ShouldLoad>()
    expectTypeOf(invalidShouldRun).toEqualTypeOf<ShouldRun>()
    expectTypeOf(invalidAsyncShouldRun).toEqualTypeOf<ShouldRun>()
})
