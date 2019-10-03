const STACKTRACE_FILTER = /(node_modules(\/|\\)(\w+)*|@wdio\/sync\/(build|src)|- - - - -)/g

export default class JasmineReporter {
    constructor (reporter, params) {
        this.reporter = reporter

        this.cid = params.cid
        this.capabilities = params.capabilities
        this.specs = params.specs
        this.shouldCleanStack = typeof params.cleanStack === 'boolean' ? params.cleanStack : true
        this.parent = []
        this.failedCount = 0
        this.startedTest = null
    }

    suiteStarted (suite) {
        this.suiteStart = new Date()
        suite.type = 'suite'
        suite.start = new Date()

        this.emit('suite:start', suite)

        const hookBeforeAll = Object.assign({}, suite)
        hookBeforeAll.type = 'hook'
        hookBeforeAll.description = '"before all" hook'
        this.emit('hook:start', hookBeforeAll)

        const hookAfterAll = Object.assign({}, suite)
        hookAfterAll.type = 'hook'
        hookAfterAll.description = '"after all" hook'
        this.emit('hook:start', hookAfterAll)

        this.parent.push({
            description: suite.description,
            id: suite.id,
            tests: 0
        })
    }

    specStarted (test) {
        this.testStart = new Date()
        test.type = 'test'
        test.start = new Date()
        this.parent[this.parent.length - 1].tests++
        this.emit('test:start', test)
    }

    specDone (test) {
        /**
         * excluded tests are treated as pending tests
         */
        if (test.status === 'excluded') {
            test.status = 'pending'
        }

        if (test.failedExpectations.length) {
            let errors = test.failedExpectations
            if (this.shouldCleanStack) {
                errors = test.failedExpectations.map(x => this.cleanStack(x))
            }
            test.errors = errors
            // We maintain the single error property for backwards compatibility with reporters
            // However, any reporter wanting to make use of Jasmine's 'soft assertion' type expects
            // should default to looking at 'errors' if they are available
            test.error = errors[0]
        }

        const e = 'test:' + test.status.replace(/ed/, '')
        test.type = 'test'
        test.duration = new Date() - this.testStart
        this.emit(e, test)
        this.failedCount += test.status === 'failed' ? 1 : 0
        this.emit('test:end', test)
    }

    suiteDone (suite) {
        const parentSuite = this.parent[this.parent.length - 1]

        /**
         * in case there is a runtime error within one of the specs
         * create an empty test to attach the error to it
         */
        if (parentSuite.tests === 0 && suite.failedExpectations.length) {
            const id = 'spec' + Math.random()
            this.specStarted({
                id,
                description: '<unknown test>',
                fullName: '<unknown test>',
                start: Date.now()
            })
            this.specDone({
                id,
                description: '<unknown test>',
                fullName: '<unknown test>',
                failedExpectations: suite.failedExpectations,
                start: Date.now(),
                status: 'failed'
            })
        }

        // errors on beforeAll are swallowed by Jasmine and can only be accessed later on
        let errorsBeforeAll
        let errorsAfterAll
        if (suite.failedExpectations.length) {
            let errors = suite.failedExpectations

            if (this.shouldCleanStack) {
                errors = suite.failedExpectations.map(x => this.cleanStack(x))
            }

            errorsBeforeAll = errors.filter(error => error.stack.includes('UserContext.beforeAll'))
            errorsAfterAll = errors.filter(error => error.stack.includes('UserContext.afterAll'))
        }

        const hookBeforeAll = Object.assign({}, suite)
        hookBeforeAll.type = 'hook'
        hookBeforeAll.parent = parentSuite
        hookBeforeAll.description = '"before all" hook'
        if (errorsBeforeAll) {
            hookBeforeAll.errors = errorsBeforeAll
            hookBeforeAll.error = errorsBeforeAll[0]
        }
        this.emit('hook:end', hookBeforeAll)

        const hookAfterAll = Object.assign({}, suite)
        hookAfterAll.type = 'hook'
        hookAfterAll.parent = parentSuite
        hookAfterAll.description = '"after all" hook'
        if (errorsAfterAll) {
            hookAfterAll.errors = errorsAfterAll
            hookAfterAll.error = errorsAfterAll[0]
        }
        this.emit('hook:end', hookAfterAll)

        this.parent.pop()
        suite.type = 'suite'
        suite.duration = new Date() - this.suiteStart
        this.emit('suite:end', suite)

        // if suite is failed due to a failure in beforeAll / afterAll, increase failed count
        this.failedCount += suite.status === 'failed' ? 1 : 0
    }

    emit (event, payload) {
        let message = {
            cid: this.cid,
            uid: this.getUniqueIdentifier(payload),
            event: event,
            title: payload.description,
            fullTitle: payload.fullName,
            pending: payload.status === 'pending',
            parent: this.parent.length ? this.getUniqueIdentifier(this.parent[this.parent.length - 1]) : null,
            type: payload.type,
            // We maintain the single error property for backwards compatibility with reporters
            // However, any reporter wanting to make use of Jasmine's 'soft assertion' type expects
            // should default to looking at 'errors' if they are available
            error: payload.error,
            errors: payload.errors,
            duration: payload.duration || 0,
            specs: this.specs,
            start: payload.start,
        }

        this.reporter.emit(event, message)
    }

    getFailedCount () {
        return this.failedCount
    }

    getUniqueIdentifier (target) {
        return target.description + target.id
    }

    cleanStack (error) {
        if (!error.stack) {
            return error
        }

        let stack = error.stack.split('\n')
        stack = stack.filter((line) => !line.match(STACKTRACE_FILTER))
        error.stack = stack.join('\n')
        return error
    }
}
