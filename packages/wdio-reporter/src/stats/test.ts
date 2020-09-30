import RunnableStats, { RunnableError, Runnable } from './runnable'

export interface Test extends Runnable {
    cid: string
    fullTitle: string
    output: []
    argument?: Argument
    retries: number
    /**
     * initial test state is pending
     * the state can change to the following: passed, skipped, failed
     */
    state: 'pending' | 'passed' | 'skipped' | 'failed'
}

interface Argument {
    rows: [{
        cells: string[]
        locations: [{
            line: number
            column: number
        }]
    }]
}

/**
 * TestStats class
 * captures data on a test.
 */
export default class TestStats extends RunnableStats {
    uid: string
    cid: string
    title: string
    fullTitle: string
    output: {}[]
    argument?: Argument
    retries: number
    /**
     * initial test state is pending
     * the state can change to the following: passed, skipped, failed
     */
    state: 'pending' | 'passed' | 'skipped' | 'failed'
    pendingReason?: string
    errors?: RunnableError[]
    error?: RunnableError

    constructor(test: Test) {
        super('test')
        this.uid = RunnableStats.getIdentifier(test)
        this.cid = test.cid
        this.title = test.title
        this.fullTitle = test.fullTitle
        this.output = []
        this.argument = test.argument
        this.retries = test.retries

        /**
         * initial test state is pending
         * the state can change to the following: passed, skipped, failed
         */
        this.state = 'pending'
    }

    pass() {
        this.complete()
        this.state = 'passed'
    }

    skip(reason: string) {
        this.pendingReason = reason
        this.state = 'skipped'
    }

    fail(errors: RunnableError[]) {
        this.complete()
        this.state = 'failed'
        this.errors = errors

        if (errors && errors.length) {
            this.error = errors[0]
        }
    }

}
