import RunnableStats, { Runnable, RunnableError } from './runnable'

export interface Hook extends Runnable {
    cid: string
    parent: string
}

export default class HookStats extends RunnableStats {
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
