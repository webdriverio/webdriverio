import RunnableStats from './runnable'

/**
 * TestStats class
 * captures data on a test.
 */
export default class TestStats extends RunnableStats {
    constructor(test) {
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

    skip(reason) {
        this.pendingReason = reason
        this.state = 'skipped'
    }

    fail(errors) {
        this.complete()
        this.state = 'failed'
        this.errors = errors

        if (errors && errors.length) {
            this.error = errors[0]
        }
    }

}
