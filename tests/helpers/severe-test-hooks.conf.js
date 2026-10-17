import { appendFileSync } from 'node:fs'
import WDIOReporter from '@wdio/reporter'
import { SevereServiceError } from 'webdriverio'

import { config as baseConfig } from './config.js'

const mode = process.env.WDIO_SEVERE_TEST_HOOKS_CASE
const output = process.env.WDIO_SEVERE_TEST_HOOKS_OUTPUT
const record = (event) => appendFileSync(output, JSON.stringify(event) + '\n')
const title = (test) => test.title || test.description
let beforeAttempts = 0
let afterAttempts = 0

class HookResultReporter extends WDIOReporter {
    onTestPass (test) {
        record({ event: 'passed', title: test.title })
    }

    onTestFail (test) {
        record({ event: 'failed', title: test.title, errors: test.errors.map(({ message, name }) => ({ message, name })) })
    }

    onTestRetry (test) {
        record({ event: 'retry', title: test.title })
    }
}

const fail = (phase, test) => {
    if (title(test) !== 'target test' || !mode.startsWith(phase)) {
        return
    }
    const attempt = phase === 'before' ? ++beforeAttempts : ++afterAttempts
    if (mode.endsWith('once') && attempt > 1) {
        return
    }
    if (mode.includes('regular')) {
        throw new Error('ordinary ' + phase + ' error')
    }
    throw new SevereServiceError('severe ' + phase + ' error')
}

const ordinaryMixed = (phase, test) => {
    if (title(test) === 'target test' && mode === phase + '-mixed') {
        throw new Error('ordinary error before the severe result')
    }
}

export const config = {
    ...baseConfig,
    logLevel: 'error',
    reporters: [[HookResultReporter, { stdout: false }]],
    beforeTest: [
        (test) => record({ event: 'beforeTest', title: title(test) }),
        (test) => ordinaryMixed('before', test),
        (test) => fail('before', test)
    ],
    afterTest: [
        (test, _context, { passed, error }) => record({
            event: 'afterTest', title: title(test), passed,
            error: error && { name: error.name, message: error.message, matcherName: error.matcherName }
        }),
        (test) => ordinaryMixed('after', test),
        async (test) => fail('after', test)
    ]
}
