import os from 'node:os'
import { fileURLToPath } from 'node:url'

import { resolveMaxContexts } from '@wdio/utils'
import type { Capabilities, Frameworks } from '@wdio/types'
import type { InlineConfig } from 'vitest/node'
import type { ViteUserConfig } from 'vitest/config'

import type { VitestOpts } from './types.js'

declare module 'vitest' {
    interface ProvidedContext {
        wdioCapabilities: WebdriverIO.Capabilities
        wdioConfigFile: string
    }
}

const DEFAULT_TEST_TIMEOUT_MS = 60_000
const SETUP_FILE = fileURLToPath(new URL('./setup.js', import.meta.url))

function isPositiveNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isMultiRemote(capabilities: unknown) {
    if (!Array.isArray(capabilities)) {
        return true
    }
    return capabilities.some((cap) => {
        const values = Object.values(cap as object)
        return values.length > 0 && values.every((value) => typeof value === 'object' && value !== null && 'capabilities' in value)
    })
}

/**
 * Builds the in-memory Vitest config from the WebdriverIO config. Returned
 * as Vite overrides, so Vitest never reads a `vitest.config` file.
 */
export function toVitestConfig({ config, specs, configFile }: Frameworks.FrameworkLaunchParams): ViteUserConfig {
    if (isMultiRemote(config.capabilities)) {
        throw new Error('@wdio/vitest-framework does not support multi-remote capabilities yet')
    }

    const { parallelMode, maxParallelContexts, setupFiles: userSetupFiles = [], ...passthrough } = (config.vitestOpts || {}) as VitestOpts
    const shared: InlineConfig = {
        isolate: true,
        globals: true,
        environment: 'node'
    }

    const projects = (config.capabilities as Capabilities.RequestedStandaloneCapabilities[]).map((capabilities, index) => {
        const cap = ('alwaysMatch' in capabilities ? capabilities.alwaysMatch : capabilities) as WebdriverIO.Capabilities
        const maxInstances = cap['wdio:maxInstances']
        return {
            // extends: true inherits the root options. Array options such as include
            // and setupFiles are concatenated, so repeating them would register the setup file twice.
            extends: true,
            test: {
                name: `${cap.browserName ?? 'browser'}-${index}`,
                provide: { wdioCapabilities: cap, wdioConfigFile: configFile },
                ...(maxInstances ? { maxWorkers: maxInstances } : {})
            } satisfies InlineConfig
        }
    })

    return {
        test: {
            ...shared,
            testTimeout: DEFAULT_TEST_TIMEOUT_MS,
            ...(isPositiveNumber(config.maxInstances) ? { maxWorkers: config.maxInstances } : {}),
            ...(isPositiveNumber(config.bail) ? { bail: config.bail } : {}),
            ...(parallelMode ? { maxConcurrency: resolveMaxContexts(maxParallelContexts, os.cpus().length) } : {}),
            ...passthrough,
            // the framework cannot work without these, so vitestOpts must not replace them
            include: specs,
            pool: 'forks',
            setupFiles: [SETUP_FILE, ...[userSetupFiles].flat()],
            projects
        } satisfies InlineConfig
    }
}
