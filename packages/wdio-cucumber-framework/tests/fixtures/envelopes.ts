import type {
    GherkinDocument, Source, SourceMediaType, TestRunStarted, Pickle,
    TestCase, TestCaseStarted, TestStepStarted, TestStepFinished,
    TestCaseFinished, TestRunFinished
} from '@cucumber/messages'

export const source: Source = {
    uri: '/path/to/features/my-feature.feature',
    data: 'some source code',
    mediaType: 'text/x.cucumber.gherkin+plain' as SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_MARKDOWN
}

export const gherkinDocument: GherkinDocument = {
    comments: [
        {
            location: {
                line: 8,
                column: 1
            },
            text: '  # Some weird comment'
        }
    ],
    feature: {
        location: {
            line: 3,
            column: 1
        },
        tags: [
            {
                location: {
                    line: 1,
                    column: 1
                },
                name: '@feature-tag1',
                id: '9'
            },
            {
                location: {
                    line: 2,
                    column: 1
                },
                name: '@feature-tag2',
                id: '10'
            }
        ],
        language: 'en',
        keyword: 'Feature',
        name: 'Example feature',
        description: '  As a user of WebdriverIO\n  I should be able to use different commands\n  to get informations about elements on the page',
        children: [
            {
                rule: {
                    keyword: '',
                    location: {
                        line: 2,
                        column: 1
                    },
                    tags: [],
                    id: '1',
                    name: 'rule name',
                    description: '',
                    children: [
                        {
                            scenario: {
                                description: 'foobar',
                                examples: [],
                                location: {
                                    line: 12,
                                    column: 3
                                },
                                tags: [
                                    {
                                        location: {
                                            line: 9,
                                            column: 3
                                        },
                                        name: '@skip(browserName=\'chrome\';platformName=\'windows\')',
                                        id: '5'
                                    },
                                    {
                                        location: {
                                            line: 10,
                                            column: 3
                                        },
                                        name: '@scenario-tag1',
                                        id: '6'
                                    },
                                    {
                                        location: {
                                            line: 11,
                                            column: 3
                                        },
                                        name: '@scenario-tag2',
                                        id: '7'
                                    }
                                ],
                                keyword: 'Scenario',
                                name: 'Get size of an element',
                                steps: [
                                    {
                                        location: {
                                            line: 13,
                                            column: 5
                                        },
                                        keyword: 'Given ',
                                        text: 'I go on the website \'https://github.com/\'',
                                        id: '0'
                                    },
                                    {
                                        location: {
                                            line: 14,
                                            column: 5
                                        },
                                        keyword: 'Then ',
                                        text: 'should the element \'.header-logged-out a\' be 32px wide and 35px high',
                                        dataTable: {
                                            location: {
                                                line: 15,
                                                column: 9
                                            },
                                            rows: [
                                                {
                                                    location: {
                                                        line: 15,
                                                        column: 9
                                                    },
                                                    cells: [
                                                        {
                                                            location: {
                                                                line: 15,
                                                                column: 11
                                                            },
                                                            value: 'Item'
                                                        },
                                                        {
                                                            location: {
                                                                line: 15,
                                                                column: 24
                                                            },
                                                            value: 'Amount'
                                                        }
                                                    ],
                                                    id: '1'
                                                },
                                                {
                                                    location: {
                                                        line: 16,
                                                        column: 9
                                                    },
                                                    cells: [
                                                        {
                                                            location: {
                                                                line: 16,
                                                                column: 11
                                                            },
                                                            value: 'Milk'
                                                        },
                                                        {
                                                            location: {
                                                                line: 16,
                                                                column: 24
                                                            },
                                                            value: '2'
                                                        }
                                                    ],
                                                    id: '2'
                                                },
                                                {
                                                    location: {
                                                        line: 17,
                                                        column: 9
                                                    },
                                                    cells: [
                                                        {
                                                            location: {
                                                                line: 17,
                                                                column: 11
                                                            },
                                                            value: 'Butter'
                                                        },
                                                        {
                                                            location: {
                                                                line: 17,
                                                                column: 24
                                                            },
                                                            value: '1'
                                                        }
                                                    ],
                                                    id: '3'
                                                }
                                            ]
                                        },
                                        id: '4'
                                    }
                                ],
                                id: '8'
                            }
                        }
                    ]
                }
            }
        ]
    },
    uri: '/some/path/to/features/my-feature.feature'
}

export const pickle: Pickle = {
    id: '13',
    uri: '/some/path/to/features/my-feature.feature',
    name: 'Get size of an element',
    language: 'en',
    steps: [
        {
            text: 'I go on the website \'https://github.com/\'',
            id: '11',
            astNodeIds: [
                '0'
            ]
        },
        {
            text: 'should the element \'.header-logged-out a\' be 32px wide and 35px high',
            argument: {
                dataTable: {
                    rows: [
                        {
                            cells: [
                                {
                                    value: 'Item'
                                },
                                {
                                    value: 'Amount'
                                }
                            ]
                        },
                        {
                            cells: [
                                {
                                    value: 'Milk'
                                },
                                {
                                    value: '2'
                                }
                            ]
                        },
                        {
                            cells: [
                                {
                                    value: 'Butter'
                                },
                                {
                                    value: '1'
                                }
                            ]
                        }
                    ]
                }
            },
            id: '12',
            astNodeIds: [
                '4'
            ]
        }
    ],
    tags: [
        {
            name: '@feature-tag1',
            astNodeId: '9'
        },
        {
            name: '@feature-tag2',
            astNodeId: '10'
        },
        {
            name: '@skip(browserName=\'chrome\';platformName=\'windows\')',
            astNodeId: '5'
        },
        {
            name: '@scenario-tag1',
            astNodeId: '6'
        },
        {
            name: '@scenario-tag2',
            astNodeId: '7'
        }
    ],
    astNodeIds: [
        '8'
    ]
}

export const testRunStarted: TestRunStarted = {
    timestamp: {
        seconds: 1609190903,
        nanos: 12000000
    }
}

export const testCase: TestCase = {
    id: '23',
    pickleId: '13',
    testSteps: [
        {
            id: '24',
            hookId: '21'
        },
        {
            id: '25',
            pickleStepId: '11',
            stepDefinitionIds: [
                '14'
            ],
            stepMatchArgumentsLists: [
                {
                    stepMatchArguments: [
                        {
                            group: {
                                start: 21,
                                value: 'https://github.com/',
                                children: []
                            }
                        }
                    ]
                }
            ]
        },
        {
            id: '26',
            pickleStepId: '12',
            stepDefinitionIds: [
                '16'
            ],
            stepMatchArgumentsLists: [
                {
                    stepMatchArguments: [
                        {
                            group: {
                                start: 20,
                                value: '.header-logged-out a',
                                children: []
                            }
                        },
                        {
                            parameterTypeName: 'int',
                            group: {
                                start: 45,
                                value: '32',
                                children: []
                            }
                        },
                        {
                            parameterTypeName: 'int',
                            group: {
                                start: 59,
                                value: '35',
                                children: []
                            }
                        }
                    ]
                }
            ]
        },
        {
            id: '27',
            hookId: '19'
        }
    ]
}

export const testCaseStarted: TestCaseStarted = {
    timestamp: {
        seconds: 1609190903,
        nanos: 21000000
    },
    attempt: 0,
    testCaseId: '23',
    id: '28'
}

export const testStepStarted: TestStepStarted = {
    timestamp: {
        seconds: 1609190903,
        nanos: 21000000
    },
    testStepId: '26',
    testCaseStartedId: '28'
}

export const testStepFinished: TestStepFinished = {
    testStepResult: {
        status: 'PASSED' as any,
        duration: {
            seconds: 0,
            nanos: 1000000
        }
    },
    timestamp: {
        seconds: 1609190903,
        nanos: 23000000
    },
    testStepId: '26',
    testCaseStartedId: '28'
}

export const testCaseFinished: TestCaseFinished = {
    timestamp: {
        seconds: 1609190903,
        nanos: 28000000
    },
    testCaseStartedId: '28',
    willBeRetried: false
}

export const testRunFinished: TestRunFinished = {
    timestamp: {
        seconds: 1609190903,
        nanos: 30000000
    },
    success: true
}
