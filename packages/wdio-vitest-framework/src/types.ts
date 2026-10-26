/// <reference types="vitest/globals" preserve="true" />
import type { InlineConfig } from 'vitest/node'
import type { ParallelMode } from '@wdio/utils'

/** Key on the Vitest file task meta, which carries the session from the worker to the reporter in the launcher process. */
export const SESSION_META_KEY = 'wdio'

/** Key on the Vitest test task meta, which carries reporter runtime API calls from the worker to the reporter in the launcher process. */
export const RUNTIME_META_KEY = 'wdio:runtime'

export const RELAYED_REPORTER_EVENTS = ['allure:startStep', 'allure:endStep', 'allure:runtimeMessage', 'junit:addProperty', 'test:log', 'test:screenshot', 'test:video-capture'] as const

export type RelayedReporterEvent = typeof RELAYED_REPORTER_EVENTS[number]

/** Marks the end of one attempt of a test; the launcher splits the relayed calls into attempts by it. */
export const ATTEMPT_EVENT = 'wdio:attempt'

export type AttemptError = { name?: string, message: string, stack?: string, expected?: unknown, actual?: unknown }

export const ATTEMPT_HOOK_KINDS = ['beforeEach', 'afterEach'] as const

export type AttemptHookKind = typeof ATTEMPT_HOOK_KINDS[number]

// isAttemptError: the hook error is the error of the attempt (the same object in the worker)
export type AttemptHook = { state: 'pass' | 'fail', error?: AttemptError, isAttemptError?: boolean }

export type AttemptMarker = {
    start: number
    end: number
    state: 'passed' | 'failed'
    error?: AttemptError
    /** The outcome of the hook kinds that ran in this attempt; absent when none did */
    hooks?: Partial<Record<AttemptHookKind, AttemptHook>>
}

export type RelayedEntry =
    | {
        event: RelayedReporterEvent
        payload: unknown
        /** Retry attempt that made the call, so the launcher can replay each attempt on its own */
        retry: number
        /** File the payload points at, which the reporter removes when the entry is never replayed */
        pendingFile?: string
    }
    | { event: typeof ATTEMPT_EVENT, payload: AttemptMarker, retry: number, pendingFile?: undefined }

export type SessionMeta = {
    sessionId: string
    capabilities: WebdriverIO.Capabilities
}

export type VitestOpts = {
    /**
     * Run `test.concurrent` tests simultaneously, each in its own browsing
     * context (window). Requires a WebDriver Bidi session. Without it,
     * `test.concurrent` throws because concurrent tests would share one window.
     *
     * - `'contexts'`: windows share the default user context, so cookies,
     *   localStorage and service workers are shared across concurrent tests.
     * - `'userContexts'`: each test gets its own user context, so storage is
     *   isolated per test. Every test pays its own login cost, and
     *   `browser.mock()` remains session-wide. Throws if the driver does not
     *   support `browser.createUserContext`.
     *
     * @default undefined
     */
    parallelMode?: ParallelMode

    /**
     * Maximum number of `test.concurrent` tests (and browsing contexts) to run
     * at the same time. Maps to Vitest's `maxConcurrency`.
     * @default os.cpus().length
     */
    maxParallelContexts?: number
} & InlineConfig

declare global {
    namespace WebdriverIO {
        interface Config {
            /**
             * Vitest specific options. Everything except `parallelMode` and
             * `maxParallelContexts` is passed through to Vitest's `test` config.
             */
            vitestOpts?: VitestOpts
        }
    }
}

/** Provided to the workers by the launcher: the single Allure results folder, or null when attachments travel inline */
export const ATTACHMENT_DIR_KEY = 'wdioAllureAttachmentDir'
