import {
    overwriteElementCommands, commandCallStructure, isValidParameter,
    getArgumentType, isFunctionAsync, filterSpecArgs
} from '../src/utils'

describe('utils', () => {
    it('commandCallStructure', () => {
        const stringFunction = 'return (function () => { })()'
        const anotherStringFunction = '!function(t,e){}'
        expect(commandCallStructure(
            'foobar',
            [
                'param',
                1,
                true,
                { a: 123 },
                () => true,
                stringFunction,
                anotherStringFunction,
                null,
                undefined
            ]
        )).toBe('foobar("param", 1, true, <object>, <fn>, <fn>, <fn>, null, undefined)')
    })

    describe('overwriteElementCommands', () => {
        it('should overwrite command', function () {
            const context = {}
            const origFnMock = jest.fn(() => 1)
            const propertiesObject = {
                foo: { value: origFnMock },
                __elementOverrides__: {
                    value: { foo(origCmd, arg) { return [origCmd(), arg] } }
                }
            }
            overwriteElementCommands.call(context, propertiesObject)
            expect(propertiesObject.foo.value(5)).toEqual([1, 5])
            expect(origFnMock.mock.calls.length).toBe(1)
            expect(origFnMock.mock.instances[0]).toBe(propertiesObject.foo)
        })

        it('should support rebinding when invoking original fn', function () {
            const context = {}
            const origFnMock = jest.fn(() => 1)
            const origFnContext = {}
            const propertiesObject = {
                foo: { value: origFnMock },
                __elementOverrides__: {
                    value: { foo(origCmd, arg) { return [origCmd.call(origFnContext), arg] } }
                }
            }
            overwriteElementCommands.call(context, propertiesObject)
            expect(propertiesObject.foo.value(5)).toEqual([1, 5])
            expect(origFnMock.mock.calls.length).toBe(1)
            expect(origFnMock.mock.instances[0]).toBe(origFnContext)
        })

        it('should create __elementOverrides__ if not exists', function () {
            const propertiesObject = {}
            overwriteElementCommands.call(null, propertiesObject)
            expect(propertiesObject.__elementOverrides__).toBeTruthy()
        })

        it('should throw if user command is not a function', function () {
            const propertiesObject = { __elementOverrides__: { value: {
                foo: 'bar'
            } } }
            expect(() => overwriteElementCommands.call(null, propertiesObject))
                .toThrow('overwriteCommand: commands be overwritten only with functions, command: foo')
        })

        it('should throw if there is no command to be propertiesObject', function () {
            const propertiesObject = { __elementOverrides__: { value: {
                foo: jest.fn()
            } } }
            expect(() => overwriteElementCommands.call(null, propertiesObject))
                .toThrow('overwriteCommand: no command to be overwritten: foo')
        })

        it('should throw on attempt to overwrite not a function', function () {
            const propertiesObject = { foo: 'bar', __elementOverrides__: { value: {
                foo: jest.fn()
            } } }
            expect(() => overwriteElementCommands.call(null, propertiesObject))
                .toThrow('overwriteCommand: only functions can be overwritten, command: foo')
        })
    })

    it('isValidParameter', () => {
        expect(isValidParameter(1, 'number')).toBe(true)
        expect(isValidParameter(1, 'number[]')).toBe(false)
        expect(isValidParameter([1], 'number[]')).toBe(true)
        expect(isValidParameter(null, 'null')).toBe(true)
        expect(isValidParameter('', 'null')).toBe(false)
        expect(isValidParameter(undefined, 'null')).toBe(false)
        expect(isValidParameter({}, 'object')).toBe(true)
        expect(isValidParameter([], 'object')).toBe(true)
        expect(isValidParameter(null, 'object')).toBe(false)
        expect(isValidParameter(1, '(number|string|object)')).toBe(true)
        expect(isValidParameter('1', '(number|string|object)')).toBe(true)
        expect(isValidParameter({}, '(number|string|object)')).toBe(true)
        expect(isValidParameter(false, '(number|string|object)')).toBe(false)
        expect(isValidParameter([], '(number|string|object)')).toBe(true)
        expect(isValidParameter(null, '(number|string|object)')).toBe(false)
        expect(isValidParameter(1, '(number|string|object)[]')).toBe(false)
        expect(isValidParameter('1', '(number|string|object)[]')).toBe(false)
        expect(isValidParameter({}, '(number|string|object)[]')).toBe(false)
        expect(isValidParameter(false, '(number|string|object)[]')).toBe(false)
        expect(isValidParameter([1], '(number|string|object)[]')).toBe(true)
        expect(isValidParameter(['1'], '(number|string|object)[]')).toBe(true)
        expect(isValidParameter([{}], '(number|string|object)[]')).toBe(true)
        expect(isValidParameter([[]], '(number|string|object)[]')).toBe(true)
        expect(isValidParameter([null], '(number|string|object)[]')).toBe(false)
        expect(isValidParameter([false], '(number|string|object)[]')).toBe(false)
        expect(isValidParameter(['1', false], '(number|string|object)[]')).toBe(false)
    })

    it('getArgumentType', () => {
        expect(getArgumentType(1)).toBe('number')
        expect(getArgumentType(1.2)).toBe('number')
        expect(getArgumentType(null)).toBe('null')
        expect(getArgumentType('text')).toBe('string')
        expect(getArgumentType({})).toBe('object')
        expect(getArgumentType([])).toBe('object')
        expect(getArgumentType(true)).toBe('boolean')
        expect(getArgumentType(false)).toBe('boolean')
    })

    describe('isFunctionAsync', () => {
        it('should return true if function is async', () => {
            expect(isFunctionAsync(async () => {})).toBe(true)
        })

        it('should return true if function name is async', () => {
            expect(isFunctionAsync(function async () {})).toBe(true)
        })

        it('should return false if function is not async', () => {
            expect(isFunctionAsync(() => {})).toBe(false)
        })

        it('should return false if some special object is passed instead of function', () => {
            expect(isFunctionAsync({})).toBe(false)
        })
    })
})

describe('utils:filterSpecArgs', () => {
    it('no args', () => {
        expect(filterSpecArgs([])).toHaveLength(0)
    })
    it('only functions', () => {
        expect(filterSpecArgs([() => {}, () => {}])).toHaveLength(0)
    })
    it('not functions', () => {
        expect(filterSpecArgs([1, 'foo', {}, []])).toEqual([1, 'foo', {}, []])
    })
    it('mixed', () => {
        expect(filterSpecArgs([false, () => {}])).toEqual([false])
    })
})
