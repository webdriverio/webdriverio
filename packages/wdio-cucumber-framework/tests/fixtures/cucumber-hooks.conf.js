import path from 'path'

const NOOP = () => {}

export default {
    capabilities: {
        browserName: 'chrome'
    },

    cucumberOpts: {
        timeout: 5000,
        require: [path.join(__dirname, '/step-definition-with-cucumber-hooks.js')]
    },

    onPrepare: NOOP,
    before: NOOP,
    beforeSuite: NOOP,
    beforeHook: NOOP,
    afterHook: NOOP,
    beforeTest: NOOP,
    beforeCommand: NOOP,
    afterCommand: NOOP,
    afterTest: NOOP,
    afterSuite: NOOP,
    after: NOOP,
    onComplete: NOOP
}
