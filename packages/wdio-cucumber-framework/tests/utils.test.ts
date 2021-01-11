import {
    createStepArgument,
    formatMessage,
    getStepType,
    getFeatureId,
    buildStepPayload,
    setUserHookNames,
    filterPickles,
} from '../src/utils'

describe('utils', () => {
    describe('createStepArgument', () => {
        it('Works without argument', () => {
            expect(typeof createStepArgument({})).toBe('undefined')
        })

        it('Works with unexpected type', () => {
            expect(typeof createStepArgument({ argument: { } }))
                .toBe('undefined')
        })

        it('Works with DataTable', () => {
            expect(createStepArgument({
                argument: {
                    dataTable: {
                        rows: [
                            { cells: [{ value: '1' }, { value: '2' }] },
                            { cells: [{ value: '3' }, { value: '4' }] },
                            { cells: [{ value: '5' }, { value: '6' }] }
                        ]
                    }
                }
            })).toMatchSnapshot()
        })

        it('Works with DocString', () => {
            expect(createStepArgument({
                argument: {
                    docString: {
                        content: 'some string content'
                    }
                }
            })).toEqual('some string content')
        })
    })

    describe('formatMessage', () => {
        it('should set passed state for test hooks', () => {
            expect(formatMessage({
                payload: { state: 'passed' }
            })).toMatchSnapshot()
        })

        it('should not fail if payload was not passed', () => {
            expect(formatMessage({})).toEqual({})
        })

        it('should set fullTitle', () => {
            expect(formatMessage({
                payload: { parent: 'foo', title: 'bar' }
            })).toEqual({
                parent: 'foo',
                title: 'bar',
                fullTitle: 'foo: bar',
            })
        })
    })

    it('getStepType', () => {
        expect(getStepType({})).toBe('test')
        expect(getStepType({ hookId: '123' })).toBe('hook')
    })

    it('getFeatureId', () => {
        expect(getFeatureId('/foo/bar.feature', {
            location: {
                line: 1,
                column: 2
            }
        })).toBe('bar.feature:1:2')
    })

    it('buildStepPayload', () => {
        expect(buildStepPayload('uri', {
            name: 'some feature'
        }, {
            id: '321',
            tags: [{ name: 'some tag' }]
        }, {
            id: '123',
            text: 'title'
        }, { type: 'hook' })).toMatchSnapshot()
    })

    it('setUserHookNames', () => {
        const options = {
            beforeTestRunHookDefinitionConfigs: [{ code: function wdioHookFoo () { } }, { code: async function someHookFoo () { } }, { code: () => { } }],
            beforeTestCaseHookDefinitionConfigs: [{ code: function wdioHookFoo () { } }, { code: function someHookFoo () { } }, { code: async () => { } }],
            afterTestCaseHookDefinitionConfigs: [{ code: function wdioHookFoo () { } }, { code: function someHookFoo () { } }, { code: async () => { } }],
            afterTestRunHookDefinitionConfigs: [{ code: function wdioHookFoo () { } }, { code: async function someHookFoo () { } }, { code: () => { } }],
        }
        setUserHookNames(options as any)
        const hookTypes = Object.values(options)
        expect(hookTypes).toHaveLength(4)
        hookTypes.forEach(hookType => {
            expect(hookType).toHaveLength(3)

            const wdioHooks = hookType.filter(hookDefinition => hookDefinition.code.name.startsWith('wdioHook'))
            const userHooks = hookType.filter(hookDefinition => hookDefinition.code.name === 'userHookFn')
            const userAsyncHooks = hookType.filter(hookDefinition => hookDefinition.code.name === 'userHookAsyncFn')
            expect(wdioHooks).toHaveLength(1)
            expect(userHooks).toHaveLength(1)
            expect(userAsyncHooks).toHaveLength(1)
        })
    })

    it('filterPickles', () => {
        expect(filterPickles({
            browserName: 'chrome'
        }, {
            id: '123',
            tags: [{ name: '@skip(browserName="chrome")' }]
        })).toBe(false)
        expect(filterPickles({
            browserName: 'chrome'
        }, {
            id: '123',
            tags: [{ name: '@skip(browserName="foobar")' }]
        })).toBe(true)
        expect(filterPickles({
            browserName: 'chrome',
            platformName: 'windows'
        }, {
            id: '123',
            tags: [{ name: '@skip(browserName="foobar";platformName="windows")' }]
        })).toBe(true)
        expect(filterPickles({
            browserName: 'chrome'
        }, {
            id: '123',
            tags: [{ name: '@skip(something=weird)' }]
        })).toBe(false)
    })
})
