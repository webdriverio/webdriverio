import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { DEFAULT_MAX_INSTANCES_PER_CAPABILITY_VALUE } from '@wdio/config'
import logger from '@wdio/logger'
import { resolveMaxContexts } from '@wdio/utils'
import type { Capabilities, Frameworks } from '@wdio/types'
import type { InlineConfig } from 'vitest/node'
import type { ViteUserConfig } from 'vitest/config'
import type * as AllureWorker from '@wdio/allure-reporter/worker'

import { WdioBridgeReporter } from './reporter.js'
import { ATTACHMENT_DIR_KEY, type VitestOpts } from './types.js'

declare module 'vitest' {
    interface ProvidedContext {
        wdioCapabilities: Capabilities.RequestedStandaloneCapabilities
        wdioConfigFile: string
        wdioArgs: Record<string, unknown>
        wdioProjectIndex: number
        [ATTACHMENT_DIR_KEY]: string | null
    }
}

const log = logger('@wdio/vitest-framework')
const ALLURE_REPORTER_NAMES = ['allure', '@wdio/allure-reporter']
// not a literal import: @wdio/allure-reporter is optional and must stay out of this package's bundle
const ALLURE_WORKER_MODULE = '@wdio/allure-reporter/worker'
const DEFAULT_TEST_TIMEOUT_MS = 60_000
const DEFAULT_HOOK_TIMEOUT_MS = 120_000
const SETUP_FILE = fileURLToPath(new URL('./setup.js', import.meta.url))

const GLOB_SPECIALS = /[\\()[\]{}*?!]/g

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
 * Where Allure attachments are written: the results folder of the only Allure reporter, or null
 * when they must travel through the launcher. Mirrors how the launcher-side BaseReporter hands options
 * to the reporters (only the entry's own options) and how the Allure reporter picks its folder.
 * Content travels through task.meta, which Vitest resends on every task update, so bytes go to disk when possible.
 */
export async function resolveAttachmentDir(reporters: unknown[] = []): Promise<string | null> {
    const entries = reporters.map((entry) => Array.isArray(entry) ? entry : [entry, {}])
    if (entries.some(([reporter]) => typeof reporter !== 'string')) {
        return null
    }
    const allureEntries = entries.filter(([reporter]) => ALLURE_REPORTER_NAMES.includes(reporter.toLowerCase()))
    if (allureEntries.length === 0) {
        return null
    }
    // every Allure reporter receives the same attachment_path, so a second one could not move the file
    if (allureEntries.length > 1) {
        log.warn('Several Allure reporters are configured, sending Allure attachments through the launcher instead')
        return null
    }
    try {
        const worker: typeof AllureWorker = await import(/* @vite-ignore */ ALLURE_WORKER_MODULE)
        return path.resolve(worker.resolveResultsDir(allureEntries[0][1] ?? {}))
    } catch (err) {
        log.warn(`Could not load ${ALLURE_WORKER_MODULE}, sending Allure attachments through the launcher instead: ${(err as Error).message}`)
        return null
    }
}

/**
 * Builds the in-memory Vitest config from the WebdriverIO config. Returned
 * as Vite overrides, so Vitest never reads a `vitest.config` file.
 */
export async function toVitestConfig({ config, specs, configFile, args, onEvent }: Frameworks.FrameworkLaunchParams, onBridgeError?: (error: unknown) => void): Promise<ViteUserConfig> {
    if (isMultiRemote(config.capabilities)) {
        throw new Error('@wdio/vitest-framework does not support multi-remote capabilities yet')
    }

    const { parallelMode, maxParallelContexts, setupFiles: userSetupFiles = [], reporters: userReporters, ...passthrough } = (config.vitestOpts || {}) as VitestOpts
    // Vitest's own console reporter stays, next to the WDIO reporters fed by the bridge
    const reporters = onEvent
        ? [...(userReporters === undefined ? ['default'] : Array.isArray(userReporters) ? userReporters : [userReporters]), new WdioBridgeReporter(config, onEvent, onBridgeError)]
        : userReporters
    const attachmentDir = await resolveAttachmentDir(config.reporters)
    const shared: InlineConfig = {
        isolate: true,
        globals: true,
        environment: 'node'
    }

    const projects = (config.capabilities as Capabilities.RequestedStandaloneCapabilities[]).map((requested, index) => {
        const cap = ('alwaysMatch' in requested ? requested.alwaysMatch : requested) as WebdriverIO.Capabilities
        const perCapability = cap['wdio:maxInstances'] || config.maxInstancesPerCapability || DEFAULT_MAX_INSTANCES_PER_CAPABILITY_VALUE
        return {
            // extends: true inherits the root options. Array options such as include
            // and setupFiles are concatenated, so repeating them would register the setup file twice.
            extends: true,
            test: {
                name: `${cap.browserName ?? 'browser'}-${index}`,
                provide: { wdioCapabilities: requested, wdioConfigFile: configFile, wdioArgs: args ?? {}, wdioProjectIndex: index, [ATTACHMENT_DIR_KEY]: attachmentDir },
                maxWorkers: isPositiveNumber(config.maxInstances) ? Math.min(perCapability, config.maxInstances) : perCapability
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
            // Vitest forks its own workers, so the local runner never applies runnerEnv to them
            env: { NODE_ENV: process.env.NODE_ENV || 'test', ...config.runnerEnv, ...passthrough.env },
            ...(reporters ? { reporters } : {}),
            // the framework cannot work without these, so vitestOpts must not replace them
            include: specs.map(toLiteralGlob),
            pool: 'forks',
            setupFiles: [SETUP_FILE, ...[userSetupFiles].flat()],
            projects
        } satisfies InlineConfig
    }
}
