import { types as nodeUtilTypes } from 'node:util'
import type { AssertionError } from 'node:assert'

import { diffWordsWithSpace } from 'diff'
import objectInspect from 'object-inspect'

import RunnableStats from './runnable.js'
import { pad, color, colorLines } from '../utils.js'
import type { Argument } from '../types.js'

const maxStringLength = 2048

export interface Test {
    type: 'test:start' | 'test:pass' | 'test:fail' | 'test:retry' | 'test:pending' | 'test:end' | 'test:skip'
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
    argument?: string | Argument
}

interface Output {
    command: string
    params: any
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
    currentTest?: string
    fullTitle: string
    output: Output[]
    argument?: string | Argument
    retries?: number
    parent: string
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
        this.parent= test.parent

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

        /**
         * Iterates through all errors to check if they're a type of 'AssertionError',
         * and formats it if so. Otherwise, just leaves error as is
         */
        const formattedErrors = errors?.map((err: Error) => (
            /**
             * only format if error object has either an "expected" or "actual" property set
             */
            (((err as AssertionError).expected || (err as AssertionError).actual) && !nodeUtilTypes.isProxy((err as AssertionError).actual)) &&
            /**
             * and if they aren't already formated, e.g. in Jasmine
             */
            (err.message && !err.message.includes('Expected: ') && !err.message.includes('Received: '))
                ? this._stringifyDiffObjs(err as AssertionError)
                : err
        ))

        this.errors = formattedErrors
        if (formattedErrors && formattedErrors.length) {
            this.error = formattedErrors[0]
        }
    }

    private _stringifyDiffObjs (err: AssertionError) {
        const inspectOpts = { maxStringLength }
        const expected = objectInspect(err.expected, inspectOpts)
        const actual = objectInspect(err.actual, inspectOpts)

        let msg = diffWordsWithSpace(actual, expected)
            .map((str) => (
                str.added
                    ? colorLines('diff added inline', str.value)
                    : str.removed
                        ? colorLines('diff removed inline', str.value)
                        : str.value
            ))
            .join('')

        // linenos
        const lines = msg.split('\n')
        if (lines.length > 4) {
            const width = String(lines.length).length
            msg = lines
                .map(function(str: string, i: number) {
                    return pad(String(++i), width) + ' |' + ' ' + str
                })
                .join('\n')
        }

        // legend
        msg = `\n${color('diff removed inline', 'actual')} ${color('diff added inline', 'expected')}\n\n${msg}\n`

        // indent
        msg = msg.replace(/^/gm, '      ')
        const newError = new Error(err.message + msg)
        newError.stack = err.stack
        return newError
    }
}
