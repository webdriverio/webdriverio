import { Runner, Suite } from '../../src'
import { getFakeTest, getFakeSuite, getFakeError, getFakeHook } from '../utils'

export const RUNNER: Runner= {
    cid: '0-0',
    _duration: 5032,
    config: { hostname: 'localhost' },
    specs: ['/foo/bar/baz.js'],
    capabilities: {},
    isMultiremote: false,
    sessionId: 'fake-session-id',
}

export const SUITE_UIDS: string[] = [
    'Foo test1',
    'Bar test2',
    'Baz test3',
]

export const SUITES: Suite[] = [
    getFakeSuite({
        uid: SUITE_UIDS[0],
        title: SUITE_UIDS[0].slice(0, -1),
        hooks: [],
        tests: [
            getFakeTest({
                uid: 'foo1',
                title: 'foo',
                state: 'passed',
                type: 'test'
            }),
            getFakeTest({
                uid: 'bar1',
                title: 'bar',
                state: 'passed',
                type: 'test'
            }),
        ]
    }),
    getFakeSuite({
        uid: SUITE_UIDS[1],
        title: SUITE_UIDS[1].slice(0, -1),
        hooks: [],
        tests: [
            getFakeTest({
                uid: 'some test1',
                title: 'some test',
                state: 'passed',
                type: 'test'
            }),
            getFakeTest({
                uid: 'a failed test2',
                title: 'a failed test',
                state: 'failed',
                type: 'test',
                error: getFakeError({
                    message: 'expected foo to equal bar',
                    stack: 'Failed test stack trace'
                }),
            }),
            getFakeTest({
                uid: 'a failed test3',
                title: 'a failed test with no stack',
                state: 'failed',
                error: getFakeError({
                    message: 'expected foo to equal bar'
                }),
            }),
        ],
    }),
    getFakeSuite({
        uid: SUITE_UIDS[2],
        title: SUITE_UIDS[2].slice(0, -1),
        hooks: [],
        tests: [
            getFakeTest({
                uid: 'foo bar baz1',
                title: 'foo bar baz',
                state: 'passed',
                type: 'test'
            }),
            getFakeTest({
                uid: 'a skipped test2',
                title: 'a skipped test',
                state: 'skipped',
                type: 'test'
            }),
        ],
    }),
]
SUITES.forEach(suite => {
    suite.hooksAndTests = [...suite.tests]
})

export const SUITES_WITH_DATA_TABLE: Suite[] = [
    getFakeSuite({
        uid: SUITE_UIDS[0],
        title: SUITE_UIDS[0].slice(0, -1),
        description: '\tSome important\ndescription to read!',
        hooks: [],
        tests: [
            getFakeTest({
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
                        cells: ['Apricot', '5'],
                        locations: [{
                            line: 24, column: 15
                        }, {
                            line: 24, column: 27
                        }]
                    }, {
                        cells: ['Brocolli', '2'],
                        locations: [{
                            line: 25, column: 15
                        }, {
                            line: 25, column: 27
                        }]
                    }, {
                        cells: ['Cucumber', '10'],
                        locations: [{
                            line: 26, column: 15
                        }, {
                            line: 26, column: 27
                        }]
                    }]
                }
            }),
            getFakeTest({
                uid: 'bar1',
                title: 'bar',
                state: 'passed',
                type: 'test'
            }),
        ]
    })
]
SUITES_WITH_DATA_TABLE.forEach(suite => {
    suite.hooksAndTests = [...suite.tests]
})

export const SUITES_MULTIPLE_ERRORS: Suite[] = [
    getFakeSuite({
        uid: SUITE_UIDS[0],
        title: SUITE_UIDS[0].slice(0, -1),
        hooks: [],
        tests: [
            getFakeTest({
                uid: 'foo1',
                title: 'foo',
                state: 'passed',
                type: 'test'
            }),
            getFakeTest({
                uid: 'bar1',
                title: 'bar',
                state: 'passed',
                type: 'test'
            }),
        ],
    }),
    getFakeSuite({
        uid: SUITE_UIDS[1],
        title: SUITE_UIDS[1].slice(0, -1),
        hooks: [],
        tests: [
            getFakeTest({
                uid: 'some test1',
                title: 'some test',
                state: 'passed',
                type: 'test'
            }),
            getFakeTest({
                uid: 'a failed test',
                title: 'a test with two failures',
                state: 'failed',
                type: 'test',
                errors: [
                    getFakeError({
                        message: 'expected the party on the first part to be the party on the first part',
                        stack: 'First failed stack trace'
                    }),
                    getFakeError({
                        message: 'expected the party on the second part to be the party on the second part',
                        stack: 'Second failed stack trace'
                    }),
                ]
            }),
        ]
    })
]
SUITES_MULTIPLE_ERRORS.forEach(suite => {
    suite.hooksAndTests = [...suite.tests]
})

export const SUITES_NO_TESTS: Suite[] = [
    getFakeSuite({
        uid: SUITE_UIDS[0],
        title: SUITE_UIDS[0].slice(0, -1),
        tests: [],
        suites: [],
        hooks: [],
        hooksAndTests: []
    })
]

export const SUITES_NO_TESTS_WITH_HOOK_ERROR: Suite[] = [
    getFakeSuite({
        uid: SUITE_UIDS[0],
        title: SUITE_UIDS[0].slice(0, -1),
        tests: [],
        suites: [],
        hooks: [
            getFakeHook({
                uid: 'a failed hook2',
                title: 'a failed hook',
                state: 'failed',
                error: getFakeError({
                    message: 'expected foo to equal bar',
                    stack: 'Failed test stack trace'
                })
            })
        ]
    })
]
SUITES_NO_TESTS_WITH_HOOK_ERROR.forEach(suite => {
    suite.hooksAndTests = [...suite.hooks]
})
