import { describe, it, expect } from 'vitest'
import yargs from 'yargs'

import { builder } from '../src/commands/run.js'

const args = ['$0', 'run', 'wdio.conf.js']

describe('Coercion Tests', () => {

    const runTest = (
        argName: string,
        argValue: string,
        expectedResult: boolean | string | number
    ) => {
        it(`coerce ${argName} to ${typeof expectedResult} values`, async () => {
            const argv = builder(yargs([...args, `--${argName}`, argValue]))
            const expected: any = {}
            const [key1, key2] = argName.split('.')
            expected[key1] = { [key2]: expectedResult }

            expect(argv.parse()).toMatchObject(expected)
        })
    }

    runTest('mochaOpts.bail', 'true', true)
    runTest('mochaOpts.fgrep', 'foo.', 'foo.')
    runTest('cucumberOpts.bail', 'false', false)
    runTest('jasmineOpts.defaultTimeoutInterval', '60000', 60000)
})
