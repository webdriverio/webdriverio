export const SUITE_UIDS = [
    'Foo test1',
    'Bar test2',
    'Baz test3',
]

export const SUITES = [
    {
        uid : SUITE_UIDS[0],
        title : SUITE_UIDS[0].slice(0, -1),
        hooks: [],
        tests : [
            {
                uid : 'foo1',
                title : 'foo',
                state : 'passed',
            },
            {
                uid : 'bar1',
                title : 'bar',
                state : 'passed',
            }
        ],
    },
    {
        uid : SUITE_UIDS[1],
        title : SUITE_UIDS[1].slice(0, -1),
        hooks: [{ error : false }],
        tests : [
            {
                uid : 'some test1',
                title : 'some test',
                state : 'passed',
            },
            {
                uid : 'a failed test2',
                title : 'a failed test',
                state : 'failed',
                error : {
                    message : 'expected foo to equal bar',
                    stack : 'Failed test stack trace'
                }
            }
        ],
    },
    {
        uid : SUITE_UIDS[2],
        title : SUITE_UIDS[2].slice(0, -1),
        hooks: [{ error : true }],
        tests : [
            {
                uid : 'foo bar baz1',
                title : 'foo bar baz',
                state : 'passed',
            },
            {
                uid : 'a skipped test2',
                title : 'a skipped test',
                state : 'skipped',
            }],
    }
]

export const SUITES_NO_TESTS = [
    {
        uid: SUITE_UIDS[0],
        title: SUITE_UIDS[0].slice(0, -1),
        tests: [],
        suites: [],
        hooks: []
    },
]
