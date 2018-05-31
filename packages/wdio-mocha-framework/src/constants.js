export const INTERFACES = {
    bdd: ['before', 'beforeEach', 'it', 'after', 'afterEach'],
    tdd: ['suiteSetup', 'setup', 'test', 'suiteTeardown', 'teardown'],
    qunit: ['before', 'beforeEach', 'test', 'after', 'afterEach']
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
    'pending': 'test:pending'
}

export const NOOP = /* istanbul ignore next */ function () {}
