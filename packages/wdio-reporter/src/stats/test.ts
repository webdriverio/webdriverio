import { pickle } from 'cucumber'

import RunnableStats from './runnable'

export interface Test {
    type: 'test:start' | 'test:pass' | 'test:fail' | 'test:retry' | 'test:pending' | 'test:end'
    title: string
    parent: string
    fullTitle: string
    pending: boolean
    file?: string
    duration?: number
    cid: string
    specs: string[]
    uid: string
    pendingReason?: string
    error?: Error
    errors?: Error[]
    retries?: number
    argument?: pickle.Argument
}

interface Output {
    method: 'PUT' | 'POST' | 'GET' | 'DELETE'
    endpoint: string
    body: {}
    result: {
        value: string | null
    }
    sessionId: string
    cid: string
    type: 'command' | 'result'
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
    output: Output[]
    argument?: pickle.Argument
    retries?: number
    /**
     * initial test state is pending
     * the state can change to the following: passed, skipped, failed
     */
    state: 'pending' | 'passed' | 'skipped' | 'failed'
    pendingReason?: string
    errors?: Error[]
    error?: Error

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

    fail(errors?: Error[]) {
        this.complete()
        this.state = 'failed'
        this.errors = errors

        if (errors && errors.length) {
            this.error = errors[0]
        }
    }

}
