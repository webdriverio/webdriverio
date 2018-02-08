import RunnableStats from './runnable'

/**
 * TestStats class
 * captures data on a test.
 */
export default class TestStats extends RunnableStats {
    constructor (runner) {
        super('test')
        this.uid = this.getIdentifier(runner)
        this.title = runner.title
        this.screenshots = []
        this.output = []

        /**
         * initial test state is pending
         * the state can change to the following: passed, skipped, failed
         */
        this.state = 'pending'
    }

    pass () {
        this.complete()
        this.state = 'passed'
    }

    skip () {
        this.state = 'skipped'
    }

    fail () {
        this.complete()
        this.state = 'failed'
    }
}
