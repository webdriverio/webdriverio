import path from 'node:path'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import webdriverMonad, { SCOPE_TYPES } from '../src/monad.js'
import logger from '@wdio/logger'
const log = logger('webdriver')

let prototype: any

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

beforeEach(() => {
    prototype = {
        scope: { value: '' },
        someFunc: { value: vi.fn().mockImplementation((arg) => `result-${arg.toString()}`) }
    }
})

const sessionId = 'c5fa4320-07d5-48f5-b7c2-922d4405e17f'

describe('monad', () => {
    it('should be able to initialize client with prototype with commands', () => {
        const modifier = vi.fn()
        const monad = webdriverMonad({ baseUrl: 'option' }, (client: any) => {
            modifier()
            return client
        }, prototype)
        const client = monad(sessionId)

        expect(client.sessionId).toBe(sessionId)
        expect(client.options).toEqual({ baseUrl: 'option' })
        expect(client.commandList).toHaveLength(1)
        expect(client.commandList[0]).toBe('someFunc')

        client.someFunc(123)
        expect(prototype.someFunc.value.mock.calls).toHaveLength(1)
        expect(prototype.someFunc.value.mock.calls[0][0]).toBe(123)
        expect(client.constructor.name).toBe('Browser')
    })

    it('should allow to set element scope name', () => {
        prototype.scope.value = 'element'
        const monad = webdriverMonad({}, (client: any) => client, prototype)
        const client = monad(sessionId)
        expect(client.constructor.name).toBe('Element')
    })

    it('should allow to extend base prototype', () => {
        const monad = webdriverMonad({}, (client: any) => client, prototype)
        const commandWrapperMock = vi.fn().mockImplementation((name, fn) => fn)
        const client = monad(sessionId, commandWrapperMock)
        const fn = () => 'bar'

        client.addCommand('foo', fn)
        expect(client.foo()).toBe('bar')
    })

    it('should allow to overwrite command in base prototype', () => {
        const monad = webdriverMonad({}, (client: any) => client, { ...prototype })
        const commandWrapperMock = vi.fn().mockImplementation((name, fn) => fn)
        const client = monad(sessionId, commandWrapperMock)
        const fn = () => 'bar'

        client.overwriteCommand('someFunc', fn)
        expect(client.someFunc()).toBe('bar')
    })

    it('should throw if there is no command to be overwritten', () => {
        const monad = webdriverMonad({}, (client: any) => client, { ...prototype })
        const commandWrapperMock = vi.fn().mockImplementation((name, fn) => fn)
        const client = monad(sessionId, commandWrapperMock)
        const fn = () => 'bar'

        expect(() => client.overwriteCommand('someFunc2', fn))
            .toThrow('overwriteCommand: no command to be overwritten: someFunc2')
    })

    it('should add element commands to the __propertiesObject__ cache', () => {
        const monad = webdriverMonad({}, (client: any) => client, prototype)
        const client = monad(sessionId)

        const func = function (x: number, y: number) { return x + y }

        client.addCommand('myCustomElementCommand', func, true)
        expect(typeof client.__propertiesObject__.myCustomElementCommand).toBe('object')
        expect(client.__propertiesObject__.myCustomElementCommand.value).toBe(func)
    })

    it('should add element commands for override to the __propertiesObject__.__elementOverrides__ cache', () => {
        const monad = webdriverMonad({}, (client: any) => client, { ...prototype })
        const client = monad(sessionId)

        const func = function (x: number, y: number) { return x + y }

        client.overwriteCommand('someFunc', func, true)
        expect(client.__propertiesObject__.__elementOverrides__.value.someFunc(2, 3)).toBe(5)
    })

    it('should add element commands to the __propertiesObject__ cache in multiremote', () => {
        const monad = webdriverMonad({}, (client: any) => client, prototype)
        const client = monad(sessionId)
        const instances = { foo: { __propertiesObject__: { myCustomElementCommand: { value: undefined } } } }

        const func = function (x: number, y: number) { return x + y }

        client.addCommand('myCustomElementCommand', func, true, undefined, instances)
        expect(typeof instances.foo.__propertiesObject__.myCustomElementCommand).toBe('object')
        expect(instances.foo.__propertiesObject__.myCustomElementCommand.value).toBe(func)
    })

    it('should add element commands for override to the __propertiesObject__.__elementOverrides__ cache in multiremote', () => {
        const monad = webdriverMonad({}, (client: any) => client, { ...prototype })
        const client = monad(sessionId)
        const instances = {
            foo: {
                __propertiesObject__: {
                    __elementOverrides__: {
                        value: {
                            someFunc: (x: number, y: number) => x - y
                        }
                    }
                }
            }
        }

        const func = function (x: number, y: number) { return x + y }

        client.overwriteCommand('someFunc', func, true, undefined, instances)
        expect(instances.foo.__propertiesObject__.__elementOverrides__.value.someFunc(4, 5)).toBe(9)
    })

    it('allows to use custom command wrapper', () => {
        const monad = webdriverMonad({}, (client: any) => client, prototype)
        const client = monad(sessionId, (commandName: string, commandFn: Function) => {
            return (...args: any[]) => {
                return `${commandName}(${args.join(', ')}) = ${commandFn(...args)}`
            }
        })
        expect(client.someFunc(123)).toBe('someFunc(123) = result-123')
    })

    it('should allow empty prototype object', () => {
        const monad = webdriverMonad({}, (client: any) => client)
        const client = monad(sessionId)
        expect(client.commandList).toHaveLength(0)
    })

    it('should be ok without modifier', () => {
        const monad = webdriverMonad({})
        const client = monad(sessionId)
        expect(client.commandList).toHaveLength(0)
    })

    describe('given custom command', () => {
        let client: any
        beforeEach(() => {
            const monad = webdriverMonad({}, (client: any) => client, prototype)
            const commandWrapperMock = vi.fn().mockImplementation((_name, fn) => fn)
            client = monad(sessionId, commandWrapperMock)
            client.emit = vi.fn()
        })
        describe('when custom command is a function', () => {
            const fn = vi.fn().mockImplementation(() => 'command result')
            const customCommandName = 'customFunctionCommand'
            beforeEach(() => {
                client.addCommand('customFunctionCommand', fn)
            })

            it('should return result when running custom command as a function and emit command and result', () => {
                const result = client.customFunctionCommand()

                expect(result).toBe('command result')
                expect(client.emit).toHaveBeenNthCalledWith(1, 'command', { command: customCommandName, args: [], name: customCommandName })
                expect(client.emit).toHaveBeenNthCalledWith(2, 'result', { command: customCommandName, name: customCommandName, result: 'command result' })
                expect(client.emit).toHaveBeenCalledTimes(2)
            })

            it('should throw and emit result when throwing an error', () => {
                const error1 = new Error('command error')
                fn.mockImplementation(() => {throw error1})

                expect(() => client.customFunctionCommand()).toThrowError('command error')
                expect(client.emit).toHaveBeenNthCalledWith(1, 'command', { command: customCommandName, args: [], name: customCommandName })
                expect(client.emit).toHaveBeenNthCalledWith(2, 'result', { command: customCommandName, name: customCommandName, result: { error: error1 } })
                expect(client.emit).toHaveBeenCalledTimes(2)
            })
        })
        describe('when custom command is a Promise', () => {
            const expectedResult = 'command promise result'
            const customCommandName = 'customPromiseCommand'
            const fn = vi.fn().mockImplementation(async () => Promise.resolve(expectedResult))
            beforeEach(() => {
                client.addCommand(customCommandName, fn)
            })

            it('should return result when running custom command and emit command + result', async () => {
                const result = await client.customPromiseCommand()

                expect(result).toBe(expectedResult)
                expect(client.emit).toHaveBeenNthCalledWith(1, 'command', { command: customCommandName, args: [], name: customCommandName })
                expect(client.emit).toHaveBeenNthCalledWith(2, 'result', { command: customCommandName, name: customCommandName, result: expectedResult })
                expect(client.emit).toHaveBeenCalledTimes(2)
            })

            it('should reject promise and emit result when throwing an error', async () => {
                const error2 = new Error('command promise error')
                fn.mockImplementation(async () => {throw error2})

                const promise = client.customPromiseCommand()

                expect(client.emit).toHaveBeenNthCalledWith(1, 'command', { command: customCommandName, args: [], name: customCommandName })
                await expect(promise).rejects.toThrowError('command promise error')
                expect(client.emit).toHaveBeenNthCalledWith(2, 'result', { command: customCommandName, name: customCommandName, result: { error: error2 } })
                expect(client.emit).toHaveBeenCalledTimes(2)
            })
        })
    })

    describe('given element scope', () => {
        let monad: any
        let ElementCtor: any

        beforeEach(() => {
            monad = webdriverMonad({}, (client: any) => client, { scope: { value: 'element' } })
            const elementInstance = monad('some-session-id')
            ElementCtor = elementInstance.constructor
        })

        it('should log command and result for element scope', async () => {
            const browser = monad(sessionId)

            // Add a command that returns an instance of ElementCtor
            browser.addCommand('myElementCommand', async function () {
                // @ts-ignore
                const element = new ElementCtor()
                element.elementId = 'abc123'
                return element
            })

            // Call the command
            await browser.myElementCommand()
            expect(log.info).toHaveBeenCalledWith('COMMAND', 'myElementCommand()')
            expect(log.info).toHaveBeenCalledWith('RESULT', 'WebdriverIO.Element<abc123>')
        })
    })

    describe('given browser scope', () => {
        let monad: any
        let BrowserCtor: any

        beforeEach(() => {
            monad = webdriverMonad({}, (client: any) => client, { scope: { value: 'browser' } })
            const browserInstance = monad('some-session-id')
            BrowserCtor = browserInstance.constructor
        })

        it('should log command and result for element scope', async () => {
            const browser = monad(sessionId)

            // Add a command that returns an instance of ElementCtor
            browser.addCommand('myElementCommand', async function () {
                // @ts-ignore
                const browser = new BrowserCtor()
                return browser
            })

            // Call the command
            await browser.myElementCommand()
            expect(log.info).toHaveBeenCalledWith('COMMAND', 'myElementCommand()')
            expect(log.info).toHaveBeenCalledWith('RESULT', 'WebdriverIO.Browser')
        })
    })
})
