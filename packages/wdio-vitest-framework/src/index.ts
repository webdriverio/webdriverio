import { startVitest, type Vitest } from 'vitest/node'
import logger from '@wdio/logger'
import type { Frameworks } from '@wdio/types'

import { toVitestConfig } from './config.js'

const log = logger('@wdio/vitest-framework')
const EXIT_SIGNALS = ['SIGINT', 'SIGTERM'] as const

function snapshotSignalListeners() {
    return EXIT_SIGNALS.map((signal) => [signal, process.listeners(signal)] as const)
}

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
    if (params.specs.length === 0 && (params.config.shard?.total ?? 1) > 1) {
        log.info(`No specs to execute in shard ${params.config.shard!.current}/${params.config.shard!.total}, exiting!`)
        return 0
    }
    let bridgeFailures = 0
    // startVitest resolves only after the run, so the instance to cancel is captured while the run starts
    let running: Vitest | undefined
    let cancelRequested = params.signal?.aborted ?? false
    const cancel = () => {
        cancelRequested = true
        running?.cancelCurrentRun('keyboard-input').catch((err) => log.warn('Failed to cancel the Vitest run:', err))
    }
    params.signal?.addEventListener('abort', cancel, { once: true })
    const viteConfig = await toVitestConfig(params, () => bridgeFailures++)
    const reporters = viteConfig.test!.reporters
    viteConfig.test!.reporters = [...(reporters === undefined ? ['default'] : Array.isArray(reporters) ? reporters : [reporters]), {
        onInit(instance: Vitest) {
            running = instance
            // Vitest's Logger exits the process 1ms after SIGINT/SIGTERM, before the launcher's exit handler finishes waiting on this launch
            listenersBefore.forEach(([signal, before]) => process.listeners(signal).filter((listener) => !before.includes(listener)).forEach((listener) => process.off(signal, listener)))
            if (cancelRequested) {
                cancel()
            }
        }
    }]
    const listenersBefore = snapshotSignalListeners()
    let vitest: Vitest | undefined
    try {
        vitest = await startVitest([], { run: true, watch: false, config: false }, viteConfig)
        // a cancelled run leaves its tests skipped or pending, which would otherwise count as green
        return countFailures(vitest) + bridgeFailures + (params.signal?.aborted ? 1 : 0)
    } finally {
        params.signal?.removeEventListener('abort', cancel)
        await vitest?.close()
    }
}

export { toVitestConfig }
export * from './types.js'
