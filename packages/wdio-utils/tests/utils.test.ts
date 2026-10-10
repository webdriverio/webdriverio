import path from 'node:path'
import fs from 'node:fs/promises'
import type { MockedFunction } from 'vitest'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import {
    overwriteElementCommands, commandCallStructure, isValidParameter, definesRemoteDriver,
    getArgumentType, isFunctionAsync, filterSpecArgs, isBase64, transformCommandLogResult,
    userImport, getBrowserObject, enableFileLogging, isAppiumCapability,
    isAbsolute
} from '../src/utils.js'
import { setWdioKind } from '../src/kind.js'

vi.mock('node:fs/promises', () => ({
    default: {
        mkdir: vi.fn(),
    }
}))

describe('utils', () => {
    it('commandCallStructure', () => {
        const stringFunction = 'return (function () => { })()'
        const asyncStringFunction = 'return (async function () => { })()'
        const anotherStringFunction = '!function(t,e){}'
        const normalStringFunction = `
            function webdriverioPolyfill() {`
        const shortStringFunction = '() => { // ... }'
        expect(commandCallStructure(
            'foobar',
            [
                'param',
                1,
                true,
                { a: 123 },
                () => true,
                stringFunction,
                asyncStringFunction,
                anotherStringFunction,
                normalStringFunction,
                shortStringFunction,
                null,
                undefined,
                (Buffer.from('some screenshot')).toString('base64')
            ]
        )).toBe('foobar("param", 1, true, <object>, <fn>, <fn>, <fn>, <fn>, <fn>, <fn>, null, undefined, "<Screenshot[base64]>")')
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
        expect(commandCallStructure('switchToWindow', ['9A562133B0552E0ECB7628F2E8A09E86']))
            .toBe('switchToWindow("9A562133B0552E0ECB7628F2E8A09E86")')
        expect(commandCallStructure('switchFrame', ['9A562133B0552E0ECB7628F2E8A09E86']))
            .toBe('switchFrame("9A562133B0552E0ECB7628F2E8A09E86")')
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
        expect(transformCommandLogResult({ script: 'return (async function isElementDisplayed(element) {\n...' }))
            .toEqual({ script: 'isElementDisplayed(...) [56 bytes]' })

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
            expect(propertiesObject.__elementOverrides__).toEqual({ value: {} })
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

    it('definesRemoteDriver', () => {
        expect(definesRemoteDriver({})).toBe(false)
        expect(definesRemoteDriver({ hostname: 'foo' })).toBe(true)
        expect(definesRemoteDriver({ port: 1 })).toBe(true)
        expect(definesRemoteDriver({ path: 'foo' })).toBe(true)
        expect(definesRemoteDriver({ protocol: 'foo' })).toBe(true)
        expect(definesRemoteDriver({ user: 'foo' })).toBe(false)
        expect(definesRemoteDriver({ key: 'foo' })).toBe(false)
        expect(definesRemoteDriver({ user: 'foo', key: 'bar' })).toBe(true)
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
        const validBase64 = Buffer.from('screenshot-bytes'.repeat(8)).toString('base64')
        expect(isBase64(validBase64)).toBe(true)
    })
    it('should return false for invalid base64 string', () => {
        const validBase64 = Buffer.from('screenshot-bytes'.repeat(8)).toString('base64')
        expect(isBase64(validBase64.slice(1))).toBe(false)
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

describe('utils:userImport', () => {
    it('should import module', async () => {
        const mod = await userImport('path')
        expect(mod).toEqual(path)
        const join = await userImport('path', 'join')
        expect(join).toEqual(path.join)
    })

    it('throws error message if named import not found', async () => {
        await expect(userImport('path', 'foo'))
            .rejects
            .toThrow('Couldn\'t find "foo" in module "path"')
    })

    it('throws error message if module not found', async () => {
        await expect(userImport('foobar'))
            .rejects
            .toThrow('Couldn\'t import "foobar"! Do you have it installed? If not run "npm install foobar"!')
    })
})

describe('utils:isAbsolute', () => {
    it.each([
        [true, 'absolute path for POSIX systems', '/path/to/file',],
        [true, 'absolute path for Windows system', 'c:\\path\\to\\file'],
        [false, 'relative path for POSIX system', 'path/to/file'],
        [false, 'relative path for Windows system', 'path\\to\\file'],
        [false, 'UNC path for Windows system', '\\\\server\\path\\to\\file'],
        [false, 'null value', ''],
    ])('should return %s when input %s', (expected:boolean, _pattern:string, pathString:string)=>{
        expect(isAbsolute(pathString)).toBe(expected)
    })

})

describe('getBrowserObject', () => {
    it('should traverse up', () => {
        expect(getBrowserObject({
            parent: {
                parent: {
                    parent: {
                        foo: 'bar'
                    }
                }
            }
        } as any)).toEqual({ foo: 'bar' })
    })

    it('should return the browser of a browsing context, found by its kind', () => {
        const browser = { foo: 'bar' }
        const context = setWdioKind({ contextId: 'tab-1', browser }, 'browsing-context')
        expect(getBrowserObject({ parent: context } as any)).toBe(browser)
    })

    it('should not take an object with only the shape of a browsing context for one', () => {
        const lookalike = { contextId: 'tab-1', browser: { foo: 'bar' } }
        expect(getBrowserObject(lookalike as any)).toBe(lookalike)
    })
})

describe('enableFileLogging', () => {
    beforeEach(() => {
        delete process.env.WDIO_LOG_PATH
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it ('should do nothing if outputDir is not provided', async () => {
        await enableFileLogging()

        expect(fs.mkdir).not.toHaveBeenCalled()
        expect(process.env.WDIO_LOG_PATH).toBeUndefined()
    })

    it('should create a directory and set WDIO_LOG_PATH to the directory path if outputDir is provided', async () => {
        const outputDir = '/path/to/log/directory'
        const expectedLogPath = path.join(outputDir, 'wdio.log')

        await enableFileLogging(outputDir)

        expect(fs.mkdir).toHaveBeenCalledWith(path.join(outputDir), { recursive: true })
        expect(process.env.WDIO_LOG_PATH).toBe(expectedLogPath)
    })

    /**
     * @wdio/local-runner gives each worker its own log file. The worker runs
     * enableFileLogging() again; replacing the path made a logger that opens its file
     * later (with a log level above info: at its first warning) open and empty the
     * launcher's wdio.log.
     */
    it('keeps a WDIO_LOG_PATH that is already set with keepLogPath', async () => {
        process.env.WDIO_LOG_PATH = path.join('/path/to/log/directory', 'spec-0-0.log')

        await enableFileLogging('/path/to/log/directory', { keepLogPath: true })

        expect(fs.mkdir).toHaveBeenCalledWith(path.join('/path/to/log/directory'), { recursive: true })
        expect(process.env.WDIO_LOG_PATH).toBe(path.join('/path/to/log/directory', 'spec-0-0.log'))
    })

    it('sets WDIO_LOG_PATH with keepLogPath when none is set', async () => {
        await enableFileLogging('/path/to/log/directory', { keepLogPath: true })

        expect(process.env.WDIO_LOG_PATH).toBe(path.join('/path/to/log/directory', 'wdio.log'))
    })

    /**
     * the launcher: a `wdio run` started from a worker (e.g. a test of a plugin)
     * inherits the worker's log file, and must not write into it
     */
    it('replaces a WDIO_LOG_PATH that is already set without keepLogPath', async () => {
        process.env.WDIO_LOG_PATH = path.join('/path/to/outer', 'spec-0-0.log')

        await enableFileLogging('/path/to/log/directory')

        expect(process.env.WDIO_LOG_PATH).toBe(path.join('/path/to/log/directory', 'wdio.log'))
    })
})

describe('isAppiumCapability', () => {
    it('should return true if it indicates an Appium capability', () => {
        expect(isAppiumCapability({})).toBe(false)
        expect(isAppiumCapability({ browserName: 'chrome' })).toBe(false)
        // @ts-expect-error unprefixed capability
        expect(isAppiumCapability({ automationName: 'android' })).toBe(false)
        expect(isAppiumCapability({ 'appium:automationName': 'android' })).toBe(true)
        expect(isAppiumCapability({ 'appium:options': { automationName: 'android' } })).toBe(true)
        // @ts-expect-error unprefixed capability
        expect(isAppiumCapability({ deviceName: 'android' })).toBe(false)
        expect(isAppiumCapability({ 'appium:deviceName': 'android' })).toBe(true)
        expect(isAppiumCapability({ 'appium:options': { deviceName: 'android' } })).toBe(true)
        expect(isAppiumCapability({ 'lt:options': { deviceName: 'android' } })).toBe(true)
        // @ts-expect-error unprefixed capability
        expect(isAppiumCapability({ appiumVersion: 'android' })).toBe(false)
        expect(isAppiumCapability({ 'appium:appiumVersion': 'android' })).toBe(true)
        expect(isAppiumCapability({ 'appium:options': { appiumVersion: 'android' } })).toBe(true)
        expect(isAppiumCapability({ 'lt:options': { appiumVersion: 'android' } })).toBe(true)
    })
})
