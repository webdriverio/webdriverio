import { config as baseConfig } from './config.js'

export const config = Object.assign({}, baseConfig, {
    before () {
        global.WDIO_SERVICE_TEST_IT_DURATION = 0
        global.WDIO_SERVICE_TEST_IT_PASSES = 0

        global.WDIO_SERVICE_TEST_HOOK_DURATION = 0
        global.WDIO_SERVICE_TEST_HOOK_PASSES = 0
    },
    beforeTest (test) {
        if (global.WDIO_SERVICE_TEST_IT_DURATION === 0) {
            throw new Error('wdio beforeTest error: ' + test.title)
        }
    },
    async afterTest (test, context, { error, duration, passed }) {
        let throwError = false
        if (global.WDIO_SERVICE_TEST_IT_DURATION === 0) {
            throwError = true
        }

        global.WDIO_SERVICE_TEST_IT_DURATION += duration
        if (!error && passed === true && await browser.pause(2) === undefined) {
            global.WDIO_SERVICE_TEST_IT_PASSES++
        }

        if (throwError) {
            throw new Error('wdio afterTest error: ' + test.title)
        }
    },
    beforeHook (test) {
        if (global.WDIO_SERVICE_TEST_HOOK_DURATION === 0) {
            throw new Error('wdio beforeHook error: ' + test.title)
        }
    },
    async afterHook (test, context, { error, duration, passed }) {
        await browser.pause(20)
        let throwError = false
        if (global.WDIO_SERVICE_TEST_HOOK_DURATION === 0) {
            throwError = true
        }

        global.WDIO_SERVICE_TEST_HOOK_DURATION += duration
        if (!error && passed === true) {
            global.WDIO_SERVICE_TEST_HOOK_PASSES++
        }

        if (throwError) {
            throw new Error('wdio afterTest error: ' + test.title)
        }
    },
    beforeSuite(suite) {
        global.WDIO_SERVICE_BEFORE_SUITE = suite
    },
    async beforeCommand() {
        await browser.pause(1)
    },
    async afterCommand() {
        await browser.pause(1)
    }
})
