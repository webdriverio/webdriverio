import RunnableStats from './runnable'

type TestState = 'passed' | 'pending' | 'failed' | 'skipped';

interface Test {
    type: string;
    cid: any;
    argument: any;
    retries?: any;
    parent: any;
    _duration?: number;
    title: string;
    pending: boolean;
    fullTitle: string;
    specs?: string[]
    state?: TestState;
    errors?: Error[];
    error?: Error;
    uid: any
}

/**
 * TestStats class
 * captures data on a test.
 */
export default class TestStats extends RunnableStats {
    uid: any
    cid: any;
    title: string;
    fullTitle: string;
    output: any[];
    argument: any;
    retries: any;
    state: TestState;
    pendingReason: any;
    errors: Error[] = [];
    error: Error | undefined;
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

    skip(reason: any) {
        this.pendingReason = reason
        this.state = 'skipped'
    }

    fail(errors: Error[]) {
        this.complete()
        this.state = 'failed'
        this.errors = errors

        if (errors && errors.length) {
            this.error = errors[0]
        }
    }

}
