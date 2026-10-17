import { appendFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { config as base } from '../helpers/config.js'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export function createConfig(scenario, events, output) {
    const record = (event) => appendFileSync(events, JSON.stringify(event) + '\n')
    let runtimeConfig
    let ready = false
    const service = {
        async onPrepare() {
            await delay(scenario.service)
            ready = true
            record({ event: 'serviceReady' })
        },
        onComplete() { record({ event: 'serviceCleanup', ready }) }
    }
    return {
        ...base,
        timeout: scenario.timeout,
        specs: (scenario.serial ? ['spec.js', 'second.js'] : ['spec.js'])
            .map(spec => fileURLToPath(new URL(spec, import.meta.url))),
        maxInstances: 1,
        outputDir: output,
        logLevel: 'error',
        reporters: [],
        services: scenario.service ? [[service], ...base.services] : base.services,
        specFileRetries: scenario.retry ? 1 : 0,
        specFileRetriesDelay: 0,
        async onPrepare(config) {
            runtimeConfig = config
            await delay(scenario.prepare || 0)
            record({ event: 'prepare' })
        },
        async onWorkerStart() {
            record({ event: 'workerStart' })
            await delay(scenario.workerHook || 0)
            record({ event: 'workerHookDone' })
        },
        onWorkerEnd() {
            // Delay only the retry, so the first failing spec always executes.
            if (scenario.retry) { runtimeConfig.specFileRetriesDelay = 3 }
            record({ event: 'workerEnd' })
        },
        async onComplete(code) {
            record({ event: 'complete', code })
            await delay(scenario.teardown || 0)
            record({ event: 'completeDone' })
        }
    }
}
