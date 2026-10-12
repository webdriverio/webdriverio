import { startVitest, type Vitest } from 'vitest/node'
import type { Frameworks } from '@wdio/types'

import { toVitestConfig } from './config.js'

/**
 * Failed tests, plus one per module that failed without a failed test (session
 * or hook errors skip the tests), plus one for unhandled errors. A run that
 * collected no modules failed to start.
 */
function countFailures(vitest: Vitest) {
    const modules = vitest.state.getTestModules()
    if (modules.length === 0 && !vitest.config.passWithNoTests) {
        return 1
    }
    const failedTests = modules.reduce((sum, module) => sum + [...module.children.allTests('failed')].length, 0)
    const erroredModules = modules.filter((module) => module.state() === 'failed' && [...module.children.allTests('failed')].length === 0).length
    return failedTests + erroredModules + (vitest.state.getUnhandledErrors().length > 0 ? 1 : 0)
}

export async function launch(params: Frameworks.FrameworkLaunchParams): Promise<number> {
    const vitest = await startVitest([], { run: true, watch: false, config: false }, toVitestConfig(params))
    try {
        return countFailures(vitest)
    } finally {
        await vitest.close()
    }
}

export { toVitestConfig }
export * from './types.js'
