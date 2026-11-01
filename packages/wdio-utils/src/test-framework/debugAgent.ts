/**
 * Hook the test runner installs while `wdio run --debug=agent` is on.
 * The framework wrapper calls it after a failed test, before user hooks.
 */
export interface DebugAgentPauseInfo {
    cid: string
    spec?: string
    test?: string
}

export interface CurrentRunnable {
    cid?: string
    spec?: string
    test?: string
}

type Pause = (info: DebugAgentPauseInfo) => Promise<void>

let pause: Pause | undefined
let runnable: CurrentRunnable | undefined

export function setDebugAgentPause (fn: Pause | undefined) {
    pause = fn
}

export function getDebugAgentPause () {
    return pause
}

export function setCurrentRunnable (next: CurrentRunnable | undefined) {
    runnable = next
}

export function getCurrentRunnable () {
    return runnable
}

/**
 * Mocha puts `title`/`file` on the test. Jasmine puts `description`.
 */
const firstString = (...values: unknown[]) => values.find((value): value is string => typeof value === 'string' && value.length > 0)

export function runnableFrom (identity: unknown): { spec?: string, test?: string } {
    if (!identity || typeof identity !== 'object') {
        return {}
    }
    const record = identity as { title?: unknown, description?: unknown, file?: unknown, filename?: unknown }
    const test = firstString(record.title, record.description)
    const spec = firstString(record.file, record.filename)
    return {
        ...(test ? { test } : {}),
        ...(spec ? { spec } : {})
    }
}

/**
 * full name of a test, with its suites (Jasmine `fullName`), else the name `runnableFrom` gives
 */
export function fullTestNameFrom (identity: unknown): string | undefined {
    const fullName = identity && typeof identity === 'object' ? (identity as { fullName?: unknown }).fullName : undefined
    return firstString(fullName) ?? runnableFrom(identity).test
}
