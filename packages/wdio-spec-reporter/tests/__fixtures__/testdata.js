export const RUNNER = {
    cid: '0-0',
    _duration: 5032,
    config: { hostname: 'localhost' },
    specs: ['/foo/bar/baz.js'],
}

export const SUITE_UIDS = [
    'Foo test1',
    'Bar test2',
    'Baz test3',
]

export const SUITES = [{
    uid: SUITE_UIDS[0],
    title: SUITE_UIDS[0].slice(0, -1),
    hooks: [],
    tests: [{
        uid: 'foo1',
        title: 'foo',
        state: 'passed',
        type: 'test'
    }, {
        uid: 'bar1',
        title: 'bar',
        state: 'passed',
        type: 'test'
    }]
}, {
    uid: SUITE_UIDS[1],
    title: SUITE_UIDS[1].slice(0, -1),
    hooks: [],
    tests: [{
        uid: 'some test1',
        title: 'some test',
        state: 'passed',
        type: 'test'
    }, {
        uid: 'a failed test2',
        title: 'a failed test',
        state: 'failed',
        type: 'test',
        error: {
            message: 'expected foo to equal bar',
            stack: 'Failed test stack trace'
        }
    }, {
        uid: 'a failed test3',
        title: 'a failed test with no stack',
        state: 'failed',
        error: {
            message: 'expected foo to equal bar'
        }
    }]
}, {
    uid: SUITE_UIDS[2],
    title: SUITE_UIDS[2].slice(0, -1),
    hooks: [],
    tests: [{
        uid: 'foo bar baz1',
        title: 'foo bar baz',
        state: 'passed',
        type: 'test'
    }, {
        uid: 'a skipped test2',
        title: 'a skipped test',
        state: 'skipped',
        type: 'test'
    }]
}]
SUITES.forEach(suite => {
    suite.hooksAndTests = [...suite.tests]
})

export const SUITES_WITH_DATA_TABLE = [{
    uid: SUITE_UIDS[0],
    title: SUITE_UIDS[0].slice(0, -1),
    description: '\tSome important\ndescription to read!',
    hooks: [],
    tests: [{
        uid: 'foo1',
        title: 'foo',
        state: 'passed',
        type: 'test',
        argument: {
            rows: [{
                cells: ['Vegetable', 'Rating'],
                locations: [{
                    line: 23, column: 15
                }, {
                    line: 23, column: 27
                }]
            }, {
                cells: ['Apricot', 5],
                locations: [{
                    line: 24, column: 15
                }, {
                    line: 24, column: 27
                }]
            }, {
                cells: ['Brocolli', 2],
                locations: [{
                    line: 25, column: 15
                }, {
                    line: 25, column: 27
                }]
            }, {
                cells: ['Cucumber', 10],
                locations: [{
                    line: 26, column: 15
                }, {
                    line: 26, column: 27
                }]
            }]
        }
    }, {
        uid: 'bar1',
        title: 'bar',
        state: 'passed',
        type: 'test'
    }]
}]
SUITES_WITH_DATA_TABLE.forEach(suite => {
    suite.hooksAndTests = [...suite.tests]
})

export const SUITES_MULTIPLE_ERRORS = [{
    uid: SUITE_UIDS[0],
    title: SUITE_UIDS[0].slice(0, -1),
    hooks: [],
    tests: [{
        uid: 'foo1',
        title: 'foo',
        state: 'passed',
        type: 'test'
    }, {
        uid: 'bar1',
        title: 'bar',
        state: 'passed',
        type: 'test'
    }]
}, {
    uid: SUITE_UIDS[1],
    title: SUITE_UIDS[1].slice(0, -1),
    hooks: [],
    tests: [{
        uid: 'some test1',
        title: 'some test',
        state: 'passed',
        type: 'test'
    }, {
        uid: 'a failed test',
        title: 'a test with two failures',
        state: 'failed',
        type: 'test',
        errors: [{
            message: 'expected the party on the first part to be the party on the first part',
            stack: 'First failed stack trace'
        }, {
            message: 'expected the party on the second part to be the party on the second part',
            stack: 'Second failed stack trace'
        }]
    }]
}]
SUITES_MULTIPLE_ERRORS.forEach(suite => {
    suite.hooksAndTests = [...suite.tests]
})

export const SUITES_NO_TESTS = [{
    uid: SUITE_UIDS[0],
    title: SUITE_UIDS[0].slice(0, -1),
    tests: [],
    suites: [],
    hooks: [],
    hooksAndTests: []
}]

export const SUITES_NO_TESTS_WITH_HOOK_ERROR = [{
    uid: SUITE_UIDS[0],
    title: SUITE_UIDS[0].slice(0, -1),
    tests: [],
    suites: [],
    hooks: [{
        uid: 'a failed hook2',
        title: 'a failed hook',
        state: 'failed',
        error: {
            message: 'expected foo to equal bar',
            stack: 'Failed test stack trace'
        }
    }]
}]
SUITES_NO_TESTS_WITH_HOOK_ERROR.forEach(suite => {
    suite.hooksAndTests = [...suite.hooks]
})
