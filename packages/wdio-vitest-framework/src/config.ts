import os from 'node:os'
import { fileURLToPath } from 'node:url'

import { resolveMaxContexts } from '@wdio/utils'
import type { Capabilities, Frameworks } from '@wdio/types'
import type { InlineConfig } from 'vitest/node'
import type { ViteUserConfig } from 'vitest/config'

import { WdioBridgeReporter } from './reporter.js'
import type { VitestOpts } from './types.js'

declare module 'vitest' {
    interface ProvidedContext {
        wdioCapabilities: Capabilities.RequestedStandaloneCapabilities
        wdioConfigFile: string
        wdioArgs: Record<string, unknown>
        wdioProjectIndex: number
    }
}

const DEFAULT_TEST_TIMEOUT_MS = 60_000
const DEFAULT_HOOK_TIMEOUT_MS = 120_000
const SETUP_FILE = fileURLToPath(new URL('./setup.js', import.meta.url))

const GLOB_SPECIALS = /[()[\]{}*?!]/g

/** Vitest matches `include` as globs, so a literal spec path with glob characters (e.g. a `(group)` folder) must be escaped */
function toLiteralGlob(path: string) {
    return path.replace(/\\/g, '/').replace(GLOB_SPECIALS, '\\$&')
}

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
export function toVitestConfig({ config, specs, configFile, args, onEvent }: Frameworks.FrameworkLaunchParams, onBridgeError?: (error: unknown) => void): ViteUserConfig {
    if (isMultiRemote(config.capabilities)) {
        throw new Error('@wdio/vitest-framework does not support multi-remote capabilities yet')
    }

    const { parallelMode, maxParallelContexts, setupFiles: userSetupFiles = [], reporters: userReporters, ...passthrough } = (config.vitestOpts || {}) as VitestOpts
    // Vitest's own console reporter stays, next to the WDIO reporters fed by the bridge
    const reporters = onEvent
        ? [...(userReporters === undefined ? ['default'] : Array.isArray(userReporters) ? userReporters : [userReporters]), new WdioBridgeReporter(config, onEvent, onBridgeError)]
        : userReporters
    const shared: InlineConfig = {
        isolate: true,
        globals: true,
        environment: 'node'
    }

    const projects = (config.capabilities as Capabilities.RequestedStandaloneCapabilities[]).map((requested, index) => {
        const cap = ('alwaysMatch' in requested ? requested.alwaysMatch : requested) as WebdriverIO.Capabilities
        const maxInstances = cap['wdio:maxInstances']
        return {
            // extends: true inherits the root options. Array options such as include
            // and setupFiles are concatenated, so repeating them would register the setup file twice.
            extends: true,
            test: {
                name: `${cap.browserName ?? 'browser'}-${index}`,
                provide: { wdioCapabilities: requested, wdioConfigFile: configFile, wdioArgs: args ?? {}, wdioProjectIndex: index },
                ...(maxInstances ? { maxWorkers: maxInstances } : {})
            } satisfies InlineConfig
        }
    })

    return {
        test: {
            ...shared,
            testTimeout: DEFAULT_TEST_TIMEOUT_MS,
            // beforeAll starts the session, which Vitest's 10s hook default cuts off on a loaded machine
            hookTimeout: isPositiveNumber(config.connectionRetryTimeout) ? config.connectionRetryTimeout : DEFAULT_HOOK_TIMEOUT_MS,
            ...(isPositiveNumber(config.maxInstances) ? { maxWorkers: config.maxInstances } : {}),
            ...(isPositiveNumber(config.bail) ? { bail: config.bail } : {}),
            ...(parallelMode ? { maxConcurrency: resolveMaxContexts(maxParallelContexts, os.cpus().length) } : {}),
            ...passthrough,
            ...(reporters ? { reporters } : {}),
            // the framework cannot work without these, so vitestOpts must not replace them
            include: specs.map(toLiteralGlob),
            pool: 'forks',
            setupFiles: [SETUP_FILE, ...[userSetupFiles].flat()],
            projects
        } satisfies InlineConfig
    }
}
