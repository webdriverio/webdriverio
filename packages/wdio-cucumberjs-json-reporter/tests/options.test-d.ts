import { expectTypeOf, test } from 'vitest'
import type { CucumberJsJsonReporterInterface } from '../src/types.js'

test('the options type has each documented option, with its type', () => {
    expectTypeOf<{ jsonFolder: string, language: string, disableHooks: boolean, reportFilePerRetry: boolean }>()
        .toExtend<CucumberJsJsonReporterInterface>()
    expectTypeOf<{ reportFilePerRetry: string }>().not.toExtend<CucumberJsJsonReporterInterface>()
})
