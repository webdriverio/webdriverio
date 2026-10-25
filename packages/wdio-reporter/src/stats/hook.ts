import RunnableStats from './runnable.js'
import type { HookKind } from '../types.js'
import type TestStats from './test.js'

export interface Hook {
    type?: string
    title: string
    parent: string
    fullTitle?: string
    pending?: boolean
    file?: string
    body?: string
    duration?: number
    cid: string
    specs?: string[]
    uid?: string
    errors?: Error[]
    error?: Error
    currentTest?: string
    /** `null` marks a top-level suite (child of the reporter root); `undefined` falls back to the open-suite stack */
    parentUid?: string | null
    /** the browsing context of a parallel hook (Vitest: the id of the test) */
    contextId?: string
    /** hook of an attempt that was retried; the attempt's error is reported on its `test:retry` */
    retried?: boolean
    /**
     * @experimental the uid of the test that failed with the error of this hook: the framework counts the
     * error one time, as the failure of that test (Vitest `beforeEach` / `afterEach`)
     */
    failedTestUid?: string
    /** @experimental the kind of the hook; without it the base keeps its owner rule of today */
    hookKind?: HookKind
    /** @experimental the uid of the suite that declares an all-hook (`beforeAll` / `afterAll`) */
    hookSuiteUid?: string
}

export default class HookStats extends RunnableStats {
    uid: string
    cid: string
    title: string
    parent: string
    // Mocha only
    body?: string
    errors?: Error[]
    error?: Error
    state?: 'failed' | 'passed'
    currentTest?: string
    // `declare`: no own property when the payload has no value, so these stats stay the same
    /** the browsing context of a parallel hook (Vitest: the id of the test) */
    declare contextId?: string
    /** the uid of the suite of the hook */
    declare parentUid?: string | null
    /** hook of an attempt that was retried; the attempt's error is reported on its `test:retry` */
    declare retried?: boolean
    /** @experimental the uid of the test that failed with the error of this hook; do not count the hook as another failure */
    declare failedTestUid?: string
    /** @experimental the kind of the hook */
    declare hookKind?: HookKind
    /** @experimental the uid of the suite that declares an all-hook */
    declare hookSuiteUid?: string
    /** @experimental the commands of a `beforeAll` / `afterAll` with `hookKind` and no context; made at the first command */
    declare output?: TestStats['output']

    constructor (runner: Hook) {
        super('hook')
        this.uid = RunnableStats.getIdentifier(runner)
        this.cid = runner.cid
        this.title = runner.title
        this.parent = runner.parent
        this.currentTest = runner.currentTest
        this.body = runner.body
        this.keepParallelFields(runner)
        if (runner.retried !== undefined) {
            this.retried = runner.retried
        }
        if (runner.failedTestUid !== undefined) {
            this.failedTestUid = runner.failedTestUid
        }
        if (runner.hookKind !== undefined) {
            this.hookKind = runner.hookKind
        }
        if (runner.hookSuiteUid !== undefined) {
            this.hookSuiteUid = runner.hookSuiteUid
        }
    }

    complete (errors?: Error[]) {
        this.errors = errors
        if (errors && errors.length) {
            this.error = errors[0]
            this.state = 'failed'
        }

        super.complete()
    }
}
