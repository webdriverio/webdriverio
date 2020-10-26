export const INTERFACES = {
    bdd: ['it', 'before', 'beforeEach', 'after', 'afterEach'],
    tdd: ['test', 'suiteSetup', 'setup', 'suiteTeardown', 'teardown'],
    qunit: ['test', 'before', 'beforeEach', 'after', 'afterEach']
}

/**
 * to map Mocha events to WDIO events
 */
export const EVENTS = {
    'suite': 'suite:start',
    'suite end': 'suite:end',
    'test': 'test:start',
    'test end': 'test:end',
    'hook': 'hook:start',
    'hook end': 'hook:end',
    'pass': 'test:pass',
    'fail': 'test:fail',
    'retry': 'test:retry',
    'pending': 'test:pending'
}

export const NOOP = /* istanbul ignore next */ function () { }
export const MOCHA_TIMEOUT_MESSAGE = 'For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves.'
export const MOCHA_TIMEOUT_MESSAGE_REPLACEMENT = [
    'The execution in the test "%s %s" took too long. Try to reduce the run time or',
    'increase your timeout for test specs (https://webdriver.io/docs/timeouts.html).'
].join(' ')
