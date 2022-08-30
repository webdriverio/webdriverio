import RunnableStats from './runnable.js'

export interface Hook {
    type?: string
    title: string
    parent: string
    fullTitle?: string
    pending?: boolean
    file?: string
    duration?: number
    cid: string
    specs?: string[]
    uid?: string
    errors?: Error[]
    error?: Error
    currentTest?: string
}

export default class HookStats extends RunnableStats {
    uid: string
    cid: string
    title: string
    parent: string
    errors?: Error[]
    error?: Error
    state?: 'failed' | 'passed'
    currentTest?: string

    constructor (runner: Hook) {
        super('hook')
        this.uid = RunnableStats.getIdentifier(runner)
        this.cid = runner.cid
        this.title = runner.title
        this.parent = runner.parent
        this.currentTest = runner.currentTest
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
