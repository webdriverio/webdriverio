import RunnableStats from './runnable.js'

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
