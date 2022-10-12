import { MOCHA_TIMEOUT_MESSAGE } from '../constants.js'
import type { FormattedMessage, FrameworkMessage } from '../types'

export function formatMessage (params: FrameworkMessage) {
    let message: FormattedMessage = {
        type: params.type
    }

    const mochaAllHooksIfPresent = params.payload?.title?.match(/^"(before|after)( all| each)?" hook/)

    if (params.err) {
        /**
         * replace "Ensure the done() callback is being called in this test." with a more meaningful message
         */
        if (params.err && params.err.message && params.err.message.includes(MOCHA_TIMEOUT_MESSAGE)) {
            const replacement = (
                `The execution in the test "${params.payload.parent.title} ${params.payload.title}" took too long. Try to reduce the run time or ` +
                'increase your timeout for test specs (https://webdriver.io/docs/timeouts).'
            )
            params.err.message = params.err.message.replace(MOCHA_TIMEOUT_MESSAGE, replacement)
            params.err.stack = params.err.stack.replace(MOCHA_TIMEOUT_MESSAGE, replacement)
        }

        message.error = {
            name: params.err.name,
            message: params.err.message,
            stack: params.err.stack,
            type: params.err.type || params.err.name,
            expected: params.err.expected,
            actual: params.err.actual
        }

        /**
         * hook failures are emitted as "test:fail"
         */
        if (mochaAllHooksIfPresent) {
            message.type = 'hook:end'
        }
    }

    if (params.payload) {
        message.title = params.payload.title
        message.parent = params.payload.parent ? params.payload.parent.title : null

        let fullTitle = message.title
        if (params.payload.parent) {
            let parent = params.payload.parent
            while (parent && parent.title) {
                fullTitle = parent.title + '.' + fullTitle
                parent = parent.parent
            }
        }

        message.fullTitle = fullTitle
        message.pending = params.payload.pending || false
        message.file = params.payload.file
        message.duration = params.payload.duration

        /**
         * Add the current test title to the payload for cases where it helps to
         * identify the test, e.g. when running inside a beforeEach hook
         */
        if (params.payload.ctx && params.payload.ctx.currentTest) {
            message.currentTest = params.payload.ctx.currentTest.title
        }

        if (params.type.match(/Test/)) {
            message.passed = (params.payload.state === 'passed')
        }

        if (params.payload.parent?.title && mochaAllHooksIfPresent) {
            const hookName = mochaAllHooksIfPresent[0]
            message.title = `${hookName} for ${params.payload.parent.title}`
        }

        if (params.payload.context) { message.context = params.payload.context }
    }

    return message
}
