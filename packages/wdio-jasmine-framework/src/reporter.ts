import logger from '@wdio/logger'
import type { EventEmitter } from 'node:events'

import type { ReporterOptions, ParentSuite, TestEvent, SuiteEvent } from './types'

const log = logger('@wdio/jasmine-framework')

const STACKTRACE_FILTER = /(node_modules(\/|\\)(\w+)*|@wdio\/sync\/(build|src)|- - - - -)/g

export default class JasmineReporter {
    public startedSuite?: SuiteEvent

    private _cid: string
    private _specs: string[]
    private _shouldCleanStack: boolean
    private _parent: ParentSuite[] = []
    private _failedCount = 0
    private _suiteStart = new Date()
    private _testStart = new Date()

    constructor (
        private _reporter: EventEmitter,
        params: ReporterOptions
    ) {
        this._cid = params.cid
        this._specs = params.specs
        this._shouldCleanStack = typeof params.cleanStack === 'boolean' ? params.cleanStack : true
    }

    suiteStarted (suite: jasmine.SuiteResult) {
        this._suiteStart = new Date()
        const newSuite: SuiteEvent = {
            type: 'suite',
            start: this._suiteStart,
            ...suite
        }

        this.startedSuite = newSuite

        let fullName = suite.description
        for (const parent of this._parent.reverse()) {
            fullName = parent.description + '.' + fullName
        }
        newSuite.fullName = fullName

        this.emit('suite:start', newSuite)
        this._parent.push({
            description: suite.description,
            id: suite.id,
            tests: 0
        })
    }

    specStarted (test: jasmine.SpecResult) {
        this._testStart = new Date()
        const newTest: TestEvent = {
            type: 'test',
            start: this._testStart,
            ...test
        }

        const parentSuite = this._parent[this._parent.length - 1]

        /**
         * if jasmine test has no root describe block, create one
         */
        if (!parentSuite) {
            log.warn(
                'No root suite was defined! This can cause reporters to malfunction. ' +
                'Please always start a spec file with describe("...", () => { ... }).'
            )
        } else {
            parentSuite.tests++
        }

        this.emit('test:start', newTest)
    }

    specDone (test: jasmine.SpecResult) {
        const newTest: TestEvent = {
            ...test,
            start: this._testStart,
            type: 'test',
            duration: Date.now() - this._testStart.getTime()
        }

        /**
         * excluded tests are treated as pending tests
         */
        if (test.status === 'excluded') {
            newTest.status = 'pending'
        }

        if (test.failedExpectations && test.failedExpectations.length) {
            let errors = test.failedExpectations
            if (this._shouldCleanStack) {
                errors = test.failedExpectations.map(x => this.cleanStack(x))
            }
            newTest.errors = errors
            // We maintain the single error property for backwards compatibility with reporters
            // However, any reporter wanting to make use of Jasmine's 'soft assertion' type expects
            // should default to looking at 'errors' if they are available
            newTest.error = errors[0]
        }

        const e = 'test:' + (newTest.status ? newTest.status.replace(/ed/, '') : 'unknown')
        this.emit(e, newTest)
        this._failedCount += test.status === 'failed' ? 1 : 0
        this.emit('test:end', newTest)
    }

    suiteDone (suite: jasmine.SuiteResult) {
        const parentSuite = this._parent[this._parent.length - 1]
        const newSuite: SuiteEvent = {
            ...suite,
            type: 'suite',
            start: this._suiteStart,
            duration: Date.now() - this._suiteStart.getTime()
        }

        /**
         * in case there is a runtime error within one of the specs
         * create an empty test to attach the error to it
         */
        if (parentSuite.tests === 0 && suite.failedExpectations && suite.failedExpectations.length) {
            const id = 'spec' + Math.random()
            this.specStarted({
                id,
                description: '<unknown test>',
                fullName: '<unknown test>',
                duration: null,
                properties: {},
                failedExpectations: [],
                deprecationWarnings: [],
                passedExpectations: [],
                status: 'unknown',
                pendingReason: '',
                debugLogs: null
            })
            this.specDone({
                id,
                description: '<unknown test>',
                fullName: '<unknown test>',
                failedExpectations: suite.failedExpectations,
                deprecationWarnings: [],
                passedExpectations: [],
                status: 'failed',
                duration: null,
                properties: {},
                pendingReason: '',
                debugLogs: null
            })
        }

        this._parent.pop()
        this.emit('suite:end', newSuite)
        delete this.startedSuite
    }

    emit (event: string, payload: SuiteEvent | TestEvent) {
        let message = {
            cid: this._cid,
            uid: this.getUniqueIdentifier(payload),
            event: event,
            title: payload.description,
            fullTitle: payload.fullName,
            pending: payload.status === 'pending',
            pendingReason: (payload as TestEvent).pendingReason,
            parent: this._parent.length ? this.getUniqueIdentifier(this._parent[this._parent.length - 1]) : null,
            type: payload.type,
            // We maintain the single error property for backwards compatibility with reporters
            // However, any reporter wanting to make use of Jasmine's 'soft assertion' type expects
            // should default to looking at 'errors' if they are available
            error: payload.error,
            errors: payload.errors,
            duration: payload.duration || 0,
            specs: this._specs,
            start: payload.start,
        }

        this._reporter.emit(event, message)
    }

    getFailedCount () {
        return this._failedCount
    }

    getUniqueIdentifier (target: Pick<TestEvent, 'description' | 'id'>) {
        return target.description + target.id
    }

    cleanStack (error: jasmine.FailedExpectation) {
        if (!error.stack) {
            return error
        }

        let stack = error.stack.split('\n')
        stack = stack.filter((line) => !line.match(STACKTRACE_FILTER))
        error.stack = stack.join('\n')
        return error
    }
}
