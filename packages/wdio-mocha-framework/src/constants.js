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
    'pending': 'test:pending'
}

export const NOOP = /* istanbul ignore next */ function () {}
