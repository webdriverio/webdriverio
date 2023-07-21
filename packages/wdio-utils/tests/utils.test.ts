import type { MockedFunction } from 'vitest'
import { vi, describe, it, expect } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'

import {
    overwriteElementCommands, commandCallStructure, isValidParameter, canAccess,
    getArgumentType, isFunctionAsync, filterSpecArgs, isBase64, transformCommandLogResult
} from '../src/utils.js'

vi.mock('fs', () => import(path.join(process.cwd(), '__mocks__', 'fs')))

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
                undefined,
                (Buffer.from('some screenshot')).toString('base64')
            ]
        )).toBe('foobar("param", 1, true, <object>, <fn>, <fn>, <fn>, null, undefined, "<Screenshot[base64]>")')
        expect(commandCallStructure('foobar', ['/html/body/a']))
            .toBe('foobar("<Screenshot[base64]>")')
        expect(commandCallStructure('findElement', ['/html/body/a']))
            .toBe('findElement("/html/body/a")')
        expect(commandCallStructure('findElements', ['/html/body/a']))
            .toBe('findElements("/html/body/a")')
        expect(commandCallStructure('findElementFromElement', ['/html/body/a']))
            .toBe('findElementFromElement("/html/body/a")')
        expect(commandCallStructure('findElementsFromElement', ['/html/body/a']))
            .toBe('findElementsFromElement("/html/body/a")')
    })

    it('transformCommandLogResult', () => {
        expect(transformCommandLogResult({ file: 'bar' })).toEqual({ file: 'bar' })
        expect(transformCommandLogResult({ file: (Buffer.from('some screenshot')).toString('base64') }))
            .toBe('"<Screenshot[base64]>"')

        expect(transformCommandLogResult({ script: 'foo' })).toEqual({ script: 'foo' })
        expect(transformCommandLogResult({ script: (Buffer.from('some script payload')).toString('base64') }))
            .toBe('"<Script[base64]>"')

        expect(transformCommandLogResult({ script: 'return foobar' })).toEqual({ script: 'return foobar' })
        expect(transformCommandLogResult({ script: 'return (function isElementDisplayed(element) {\n...' }))
            .toEqual({ script: 'isElementDisplayed(...) [50 bytes]' })

        expect(transformCommandLogResult({ script: '!function(t,e){"object"==typeof exports&&"object"==typeof mod...' }))
            .toEqual({ script: '<minified function> [64 bytes]' })
    })

    describe('overwriteElementCommands', () => {
        it('should overwrite command', function () {
            const context = {}
            const origFnMock: (arg: any) => void = vi.fn(() => 1)
            const propertiesObject = {
                foo: { value: origFnMock },
                __elementOverrides__: {
                    value: { foo(origCmd: Function, arg: any) { return [origCmd(), arg] } }
                }
            }
            overwriteElementCommands.call(context, propertiesObject)
            expect(propertiesObject.foo.value(5))
                .toEqual([1, 5])
            expect((origFnMock as MockedFunction<any>).mock.calls.length)
                .toBe(1)
            expect((origFnMock as MockedFunction<any>).mock.instances[0])
                .toBe(propertiesObject.foo)
        })

        it('should support rebinding when invoking original fn', function () {
            const context = {}
            const origFnMock: (arg: any) => void = vi.fn(() => 1)
            const origFnContext = {}
            const propertiesObject = {
                foo: { value: origFnMock },
                __elementOverrides__: {
                    value: { foo(origCmd: Function, arg: any) { return [origCmd.call(origFnContext), arg] } }
                }
            }
            overwriteElementCommands.call(context, propertiesObject)
            expect(propertiesObject.foo.value(5))
                .toEqual([1, 5])
            expect((origFnMock as MockedFunction<any>).mock.calls.length)
                .toBe(1)
            expect((origFnMock as MockedFunction<any>).mock.instances[0])
                .toBe(origFnContext)
        })

        it('should create __elementOverrides__ if not exists', function () {
            const propertiesObject = { __elementOverrides__: undefined }
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
                foo: vi.fn()
            } } }
            expect(() => overwriteElementCommands.call(null, propertiesObject))
                .toThrow('overwriteCommand: no command to be overwritten: foo')
        })

        it('should throw on attempt to overwrite not a function', function () {
            const propertiesObject = { foo: 'bar', __elementOverrides__: { value: {
                foo: vi.fn()
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
            expect(isFunctionAsync({} as unknown as Function)).toBe(false)
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

describe('utils:isBase64', () => {
    it('should return true for valid base64 string', () => {
        const validBase64 = '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'
        expect(isBase64(validBase64)).toBe(true)
    })
    it('should return false for invalid base64 string', () => {
        const inValidBase64 = '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'
        expect(isBase64(inValidBase64)).toBe(false)
    })
    it('should throw if there no input to be checked', () => {
        // @ts-ignore
        expect(() => isBase64()).toThrow('Expected string but received invalid type.')
    })
    it('should throw if input type not a string', () => {
        // @ts-ignore
        expect(() => isBase64(null)).toThrow('Expected string but received invalid type.')
    })
})

describe('utils:canAccess', () => {
    it('canAccess', () => {
        expect(canAccess('/foobar')).toBe(true)
        expect(fs.accessSync).toBeCalledWith('/foobar')

        // @ts-ignore
        fs.accessSync.mockImplementation(() => {
            throw new Error('upps')
        })
        expect(canAccess('/foobar')).toBe(false)
    })
})
