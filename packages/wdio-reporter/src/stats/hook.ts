import RunnableStats, { RunnableError } from './runnable'

export interface Hook {
    type: 'hook:start' | 'hook:end'
    title: string
    parent: string
    fullTitle: string
    pending: boolean
    file?: string
    duration?: number
    cid: string
    specs: string[]
    uid: string
    errors?: RunnableError[]
    error?: RunnableError
}

export default class HookStats extends RunnableStats {
    uid: string
    cid: string
    title: string
    parent: string
    errors?: RunnableError[]
    error?: RunnableError
    state?: 'failed'

    constructor (runner: Hook) {
        super('hook')
        this.uid = RunnableStats.getIdentifier(runner)
        this.cid = runner.cid
        this.title = runner.title
        this.parent = runner.parent
    }

    complete (errors?: RunnableError[]) {
        this.errors = errors
        if (errors && errors.length) {
            this.error = errors[0]
            this.state = 'failed'
        }

        super.complete()
    }
}
