import path from 'node:path'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import webdriverMonad, { shareCommands } from '../src/monad.js'
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

function createElement(elementOverrides: PropertyDescriptor, command: Function) {
    return webdriverMonad({}, (element: any) => element, {
        scope: { value: 'element' },
        someFunc: { value: command },
        __elementOverrides__: elementOverrides
    })(sessionId)
}

describe('monad', () => {
    it('does not pass event handler functions through the command wrapper', () => {
        const commandWrapper = vi.fn().mockImplementation((_name, fn) => fn)
        const noop = () => {}
        const events = ['on', 'off', 'emit', 'once', 'removeListener', 'removeAllListeners']
        webdriverMonad({}, (client: any) => client, {
            ...prototype,
            ...Object.fromEntries(events.map((name) => [name, { value: noop }]))
        })(sessionId, commandWrapper)

        const wrapped = commandWrapper.mock.calls.map(([name]) => name)
        expect(wrapped).toContain('someFunc')
        for (const name of events) {
            expect(wrapped, name).not.toContain(name)
        }
    })

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

    it('announces the scope of custom commands to the browser runner', () => {
        const originalSend = process.send
        const send = vi.fn()
        vi.stubEnv('WDIO_WORKER_ID', '0-0')
        process.send = send
        try {
            const client = webdriverMonad({}, (browser: any) => browser, prototype)(sessionId)
            client.addCommand('browserCommand', () => 'browser')
            client.addCommand('elementCommand', () => 'element', { attachToElement: true })

            expect(send).toHaveBeenNthCalledWith(1, expect.objectContaining({
                args: expect.objectContaining({
                    value: { commandName: 'browserCommand', cid: '0-0', attachToElement: false }
                })
            }))
            expect(send).toHaveBeenNthCalledWith(2, expect.objectContaining({
                args: expect.objectContaining({
                    value: { commandName: 'elementCommand', cid: '0-0', attachToElement: true }
                })
            }))
        } finally {
            process.send = originalSend
            vi.unstubAllEnvs()
        }
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

        client.addCommand('myCustomElementCommand', func, { attachToElement: true })
        expect(typeof client.__propertiesObject__.myCustomElementCommand).toBe('object')
        expect(client.__propertiesObject__.myCustomElementCommand.value).toBe(func)
    })

    it('should add element commands for override to the __propertiesObject__.__elementOverrides__ cache', () => {
        const monad = webdriverMonad({}, (client: any) => client, { ...prototype })
        const client = monad(sessionId)

        const func = function (x: number, y: number) { return x + y }

        client.overwriteCommand('someFunc', func, { attachToElement: true })
        expect(client.__propertiesObject__.__elementOverrides__.value.someFunc(2, 3)).toBe(5)
    })

    it('should compose sequential element command overrides and propagate arguments and return values', async () => {
        const client = webdriverMonad({}, (browser: any) => browser, { ...prototype })(sessionId)
        const calls: string[] = []

        client.overwriteCommand('someFunc', async (originalCommand: Function, value: string) => {
            calls.push(`first before: ${value}`)
            const result = await originalCommand('value from first')
            calls.push('first after')
            return `first(${result})`
        }, { attachToElement: true })
        client.overwriteCommand('someFunc', async (originalCommand: Function, value: string) => {
            calls.push(`second before: ${value}`)
            const result = await originalCommand('value from second')
            calls.push('second after')
            return `second(${result})`
        }, { attachToElement: true })

        const element = createElement(client.__propertiesObject__.__elementOverrides__, async (value: string) => {
            calls.push(`base: ${value}`)
            return 'base result'
        })

        await expect(element.someFunc('initial value')).resolves.toBe('second(first(base result))')
        expect(calls).toEqual([
            'second before: initial value',
            'first before: value from second',
            'base: value from first',
            'first after',
            'second after'
        ])
    })

    it.each([
        {
            name: 'plugin before guard',
            register: (client: any, plugin: Function, guard: Function) => {
                client.overwriteCommand('someFunc', plugin, { attachToElement: true })
                client.overwriteCommand('someFunc', guard, { attachToElement: true })
            },
            expected: ['guard start', 'plugin', 'base', 'guard wait']
        },
        {
            name: 'guard before plugin',
            register: (client: any, plugin: Function, guard: Function) => {
                client.overwriteCommand('someFunc', guard, { attachToElement: true })
                client.overwriteCommand('someFunc', plugin, { attachToElement: true })
            },
            expected: ['plugin', 'guard start', 'base', 'guard wait']
        }
    ])('should preserve a navigation guard with $name', async ({ register, expected }) => {
        const client = webdriverMonad({}, (browser: any) => browser, { ...prototype })(sessionId)
        const calls: string[] = []
        let resolveBase!: (value: string) => void
        const baseResult = new Promise<string>((resolve) => {
            resolveBase = resolve
        })
        const plugin = async (originalCommand: Function) => {
            calls.push('plugin')
            return originalCommand()
        }
        const guard = async (originalCommand: Function) => {
            calls.push('guard start')
            const result = await originalCommand()
            calls.push('guard wait')
            return result
        }

        register(client, plugin, guard)
        const element = createElement(client.__propertiesObject__.__elementOverrides__, async () => {
            calls.push('base')
            return baseResult
        })
        let commandSettled = false
        const commandResult = element.someFunc().then((result: string) => {
            commandSettled = true
            return result
        })

        await Promise.resolve()
        expect(commandSettled).toBe(false)
        expect(calls).toEqual(expected.slice(0, -1))

        resolveBase('base result')
        await expect(commandResult).resolves.toBe('base result')
        expect(calls).toEqual(expected)
    })

    it('should propagate errors through sequential element command overrides', async () => {
        const client = webdriverMonad({}, (browser: any) => browser, { ...prototype })(sessionId)
        const calls: string[] = []
        const error = new Error('boom')

        client.overwriteCommand('someFunc', async (originalCommand: Function) => {
            try {
                return await originalCommand()
            } catch (err) {
                calls.push('first caught')
                throw err
            }
        }, { attachToElement: true })
        client.overwriteCommand('someFunc', async (originalCommand: Function) => {
            try {
                return await originalCommand()
            } catch (err) {
                calls.push('second caught')
                throw err
            }
        }, { attachToElement: true })

        const element = createElement(client.__propertiesObject__.__elementOverrides__, async () => {
            calls.push('base')
            throw error
        })

        await expect(element.someFunc()).rejects.toBe(error)
        expect(calls).toEqual(['base', 'first caught', 'second caught'])
    })

    it('should preserve explicit context rebinding through sequential element command overrides', () => {
        const client = webdriverMonad({}, (browser: any) => browser, { ...prototype })(sessionId)
        const reboundElement = { name: 'rebound element' }
        let firstContext: unknown
        let secondContext: unknown
        let baseContext: unknown

        client.overwriteCommand('someFunc', function (this: unknown, originalCommand: Function, value: string) {
            firstContext = this
            return originalCommand(value)
        }, { attachToElement: true })
        client.overwriteCommand('someFunc', function (this: unknown, originalCommand: Function, value: string) {
            secondContext = this
            return originalCommand.call(reboundElement, value)
        }, { attachToElement: true })

        const element = createElement(client.__propertiesObject__.__elementOverrides__, function (this: unknown, value: string) {
            baseContext = this
            return value
        })

        expect(element.someFunc('command result')).toBe('command result')
        expect(secondContext).toBe(element)
        expect(firstContext).toBe(reboundElement)
        expect(baseContext).toBe(reboundElement)
    })

    it('should compose three element command overrides in reverse registration order', () => {
        const client = webdriverMonad({}, (browser: any) => browser, { ...prototype })(sessionId)
        const calls: string[] = []

        for (const label of ['first', 'second', 'third']) {
            client.overwriteCommand('someFunc', (originalCommand: Function) => {
                calls.push(label)
                return originalCommand()
            }, { attachToElement: true })
        }

        const element = createElement(client.__propertiesObject__.__elementOverrides__, () => calls.push('base'))

        element.someFunc()
        expect(calls).toEqual(['third', 'second', 'first', 'base'])
    })

    it('should add element commands to the __propertiesObject__ cache in multi-remote', () => {
        const monad = webdriverMonad({}, (client: any) => client, prototype)
        const client = monad(sessionId)
        const instances = { foo: { __propertiesObject__: { myCustomElementCommand: { value: undefined } } } }

        const func = function (x: number, y: number) { return x + y }

        client.addCommand('myCustomElementCommand', func, { attachToElement: true, instances })
        expect(typeof instances.foo.__propertiesObject__.myCustomElementCommand).toBe('object')
        expect(instances.foo.__propertiesObject__.myCustomElementCommand.value).toBe(func)
    })

    it('should compose element command overrides in multi-remote', () => {
        const monad = webdriverMonad({}, (client: any) => client, { ...prototype })
        const client = monad(sessionId)
        const calls: string[] = []
        const instances = {
            foo: {
                __propertiesObject__: {
                    __elementOverrides__: {
                        value: {}
                    }
                }
            },
            bar: {
                __propertiesObject__: {
                    __elementOverrides__: {
                        value: {}
                    }
                }
            }
        }

        client.overwriteCommand('someFunc', function (originalCommand: Function, value: string) {
            calls.push(`first: ${value}`)
            return originalCommand(`${value} -> first`)
        }, { attachToElement: true, instances })
        client.overwriteCommand('someFunc', function (originalCommand: Function, value: string) {
            calls.push(`second: ${value}`)
            return originalCommand(`${value} -> second`)
        }, { attachToElement: true, instances })
        const fooElement = createElement(instances.foo.__propertiesObject__.__elementOverrides__, (value: string) => {
            calls.push(`foo base: ${value}`)
            return `foo: ${value}`
        })
        const barElement = createElement(instances.bar.__propertiesObject__.__elementOverrides__, (value: string) => {
            calls.push(`bar base: ${value}`)
            return `bar: ${value}`
        })

        expect(fooElement.someFunc('start')).toBe('foo: start -> second -> first')
        expect(barElement.someFunc('start')).toBe('bar: start -> second -> first')
        expect(calls).toEqual([
            'second: start',
            'first: start -> second',
            'foo base: start -> second -> first',
            'second: start',
            'first: start -> second',
            'bar base: start -> second -> first'
        ])
    })

    it('should invoke command wrappers once for each composed element override', () => {
        const calls: string[] = []
        const client = webdriverMonad({}, (browser: any) => browser, { ...prototype })(sessionId, (commandName: string, commandFn: Function) => {
            return function (this: unknown, ...args: unknown[]) {
                calls.push(`wrapper: ${commandName}`)
                return commandFn.apply(this, args)
            }
        })

        client.overwriteCommand('someFunc', (originalCommand: Function) => originalCommand(), { attachToElement: true })
        client.overwriteCommand('someFunc', (originalCommand: Function) => originalCommand(), { attachToElement: true })

        const element = createElement(client.__propertiesObject__.__elementOverrides__, () => calls.push('base'))

        element.someFunc()
        expect(calls).toEqual(['wrapper: someFunc', 'wrapper: someFunc', 'base'])
    })

    it('should keep composing sequential browser command overrides', () => {
        const client = webdriverMonad({}, (browser: any) => browser, { ...prototype })(sessionId, (_commandName: string, commandFn: Function) => commandFn)
        const calls: string[] = []

        client.overwriteCommand('someFunc', (originalCommand: Function, value: string) => {
            calls.push('first')
            return originalCommand(`${value} -> first`)
        })
        client.overwriteCommand('someFunc', (originalCommand: Function, value: string) => {
            calls.push('second')
            return originalCommand(`${value} -> second`)
        })

        expect(client.someFunc('start')).toBe('result-start -> second -> first')
        expect(calls).toEqual(['second', 'first'])
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

    /**
     * `getElements` gives one property object to the monad of every item of a list
     */
    describe('clients built from one property object', () => {
        const layer = (commandName: string, commandFn: Function) => function (this: unknown, ...args: unknown[]) {
            return `[${commandFn.apply(this, args)}]`
        }

        it('wraps the commands of each client once', () => {
            const first = webdriverMonad({}, (client: any) => client, prototype)(sessionId, layer)
            const second = webdriverMonad({}, (client: any) => client, prototype)(sessionId, layer)

            expect(first.someFunc(1)).toBe('[result-1]')
            expect(second.someFunc(1)).toBe('[result-1]')
        })

        it('wraps the commands of each client of one monad once', () => {
            const monad = webdriverMonad({}, (client: any) => client, prototype)
            const first = monad(sessionId, layer)
            const second = monad(sessionId, layer)

            expect(first.someFunc(1)).toBe('[result-1]')
            expect(second.someFunc(1)).toBe('[result-1]')
        })

        it('applies the element overrides to each client once', () => {
            const properties = {
                scope: { value: 'element' },
                someFunc: { value: (arg: number) => `result-${arg}` },
                __elementOverrides__: { value: { someFunc (origCommand: Function, arg: number) { return `override(${origCommand(arg)})` } } }
            }
            const first = webdriverMonad({}, (client: any) => client, properties)(sessionId, layer)
            const second = webdriverMonad({}, (client: any) => client, properties)(sessionId, layer)

            expect(first.someFunc(1)).toBe('override([result-1])')
            expect(second.someFunc(1)).toBe('override([result-1])')
        })

        it('does not change the property object of the caller', () => {
            const command = prototype.someFunc.value
            prototype.scope.value = 'element'
            const client = webdriverMonad({}, (client: any) => client, prototype)(sessionId, layer)

            expect(client.constructor.name).toBe('Element')
            expect(prototype.someFunc.value).toBe(command)
            expect(Object.keys(prototype)).toEqual(['scope', 'someFunc'])
            expect(prototype.scope).toEqual({ value: 'element' })
        })
    })

    it('does not wrap an element-scoped emit so a throwing listener throws at the emit site', () => {
        const browserEmit = vi.fn(() => { throw new Error('listener failed') })
        const wrapper = vi.fn((_name: string, fn: Function) => async (...args: unknown[]) => fn(...args))
        const element = webdriverMonad({}, (client: any) => client, {
            ...prototype,
            emit: { value: browserEmit }
        })(sessionId, wrapper)
        expect(() => element.emit('command', { command: 'foo' })).toThrow('listener failed')
        expect(wrapper).not.toHaveBeenCalledWith('emit', expect.anything(), expect.anything())
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

    it('tracks dialog listener state through once and removals', () => {
        const client = webdriverMonad({}, (browser: any) => browser, { ...prototype })(sessionId)
        const registered = vi.fn()
        const removed = vi.fn()
        const onceListener = vi.fn()
        const firstListener = vi.fn()
        const secondListener = vi.fn()

        client.on('_dialogListenerRegistered', registered)
        client.on('_dialogListenerRemoved', removed)

        client.once('dialog', onceListener)
        expect(registered, 'once dialog listener registration must disable auto handling').toHaveBeenCalledTimes(1)

        client.on('dialog', firstListener)
        client.on('dialog', secondListener)
        expect(registered).toHaveBeenCalledTimes(1)

        const dialog = { message: 'confirmation' }
        client.emit('dialog', dialog)
        expect(onceListener).toHaveBeenCalledWith(dialog)
        expect(onceListener).toHaveBeenCalledTimes(1)
        expect(removed).not.toHaveBeenCalled()

        client.removeListener('dialog', firstListener)
        expect(removed).not.toHaveBeenCalled()

        client.off('dialog', secondListener)
        expect(removed).toHaveBeenCalledTimes(1)

        const removedOnceListener = vi.fn()
        client.once('dialog', removedOnceListener)
        expect(registered).toHaveBeenCalledTimes(2)
        client.removeListener('dialog', removedOnceListener)
        expect(removed).toHaveBeenCalledTimes(2)
        client.emit('dialog', dialog)
        expect(removedOnceListener).not.toHaveBeenCalled()

        client.on('dialog', firstListener)
        client.on('dialog', secondListener)
        expect(registered).toHaveBeenCalledTimes(3)
        client.removeAllListeners('dialog')
        expect(removed).toHaveBeenCalledTimes(3)

        client.on('dialog', firstListener)
        expect(registered).toHaveBeenCalledTimes(4)
        client.removeAllListeners()
        expect(removed).toHaveBeenCalledTimes(4)

        const ordinaryListener = vi.fn()
        client.on('result', ordinaryListener)
        client.emit('result', dialog)
        expect(ordinaryListener).toHaveBeenCalledWith(dialog)
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
                expect(client.emit).toHaveBeenNthCalledWith(1, 'command', { command: customCommandName, body: [] })
                expect(client.emit).toHaveBeenNthCalledWith(2, 'result', { command: customCommandName, result: { value: 'command result' } })
                expect(client.emit).toHaveBeenCalledTimes(2)
            })

            it('should throw and emit result when throwing an error', () => {
                const error1 = new Error('command error')
                fn.mockImplementation(() => {throw error1})

                expect(() => client.customFunctionCommand()).toThrowError('command error')
                expect(client.emit).toHaveBeenNthCalledWith(1, 'command', { command: customCommandName, body: [] })
                expect(client.emit).toHaveBeenNthCalledWith(2, 'result', { command: customCommandName, result: { error: error1 } })
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
                expect(client.emit).toHaveBeenNthCalledWith(1, 'command', { command: customCommandName, body: [] })
                expect(client.emit).toHaveBeenNthCalledWith(2, 'result', { command: customCommandName, result: { value: expectedResult } })
                expect(client.emit).toHaveBeenCalledTimes(2)
            })

            it('should reject promise and emit result when throwing an error', async () => {
                const error2 = new Error('command promise error')
                fn.mockImplementation(async () => {throw error2})

                const promise = client.customPromiseCommand()

                expect(client.emit).toHaveBeenNthCalledWith(1, 'command', { command: customCommandName, body: [],  })
                await expect(promise).rejects.toThrowError('command promise error')
                expect(client.emit).toHaveBeenNthCalledWith(2, 'result', { command: customCommandName, result: { error: error2 } })
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

        it('should log command and result for browser scope', async () => {
            const browser = monad(sessionId)

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

    it('puts a command on a given prototype as an assignment does', () => {
        class Driver {
            method () { return 'class method' }
        }
        const client = webdriverMonad({}, (c: any) => c, prototype)(sessionId)
        client.addCommand('method', () => 'added', { proto: Driver.prototype })
        const descriptor = Object.getOwnPropertyDescriptor(Driver.prototype, 'method')
        expect(descriptor?.enumerable).toBe(false)
        expect(descriptor?.value).not.toBe(undefined)
        expect(Object.keys(Driver.prototype)).toEqual([])
    })

    /**
     * the clients of one list share their wrapped commands (#16086)
     */
    describe('shareCommands', () => {
        const listOf = (count: number, properties: Record<string, PropertyDescriptor>) => {
            const commandWrapper = vi.fn((name: string, fn: Function) => function (this: unknown, ...args: unknown[]) { return fn.apply(this, args) })
            const shared = shareCommands({ baseUrl: 'option' }, { scope: { value: 'element' }, ...properties }, commandWrapper)
            const clients = Array.from({ length: count }, (_, i) => webdriverMonad({ baseUrl: 'option' }, (client: any) => {
                client.index = i
                return client
            }, shared as never)(sessionId, commandWrapper))
            return { clients, commandWrapper }
        }

        it('wraps each command once for all clients, which share it', () => {
            const { clients, commandWrapper } = listOf(3, { someFunc: { value: () => 'some' }, otherFunc: { value: () => 'other' } })
            expect(commandWrapper.mock.calls.map(([name]) => name)).toEqual(['someFunc', 'otherFunc'])
            expect(clients[0].someFunc).toBe(clients[2].someFunc)
            expect(clients[1].someFunc()).toBe('some')
            expect(Object.prototype.hasOwnProperty.call(clients[0], 'someFunc')).toBe(false)
        })

        it('keeps the scope, the options, the command list and the own values of each client', () => {
            const { clients } = listOf(2, { someFunc: { value: () => 'some' } })
            expect(clients[0].constructor.name).toBe('Element')
            expect(clients[1].options).toEqual({ baseUrl: 'option' })
            expect(clients[1].commandList).toEqual(['someFunc'])
            expect(Object.keys(clients[1].__propertiesObject__)).toContain('someFunc')
            expect(clients.map((client) => [client.index, client.sessionId])).toEqual([[0, sessionId], [1, sessionId]])
        })

        it('runs the element overrides once, for every client', () => {
            const override = vi.fn(function (this: any, orig: Function) { return `over:${orig()}` })
            const { clients } = listOf(2, { someFunc: { value: () => 'some' }, __elementOverrides__: { value: { someFunc: override } } })
            expect(clients[0].someFunc()).toBe('over:some')
            expect(clients[1].someFunc()).toBe('over:some')
            expect(override.mock.contexts).toEqual([clients[0], clients[1]])
        })

        it('keeps an emit of the map before the events of the client', () => {
            const emit = vi.fn()
            const { clients } = listOf(2, { emit: { value: emit } })
            clients[1].emit('command', { command: 'x' })
            expect(emit).toHaveBeenCalledWith('command', { command: 'x' })
            expect(Object.prototype.hasOwnProperty.call(clients[1], 'emit')).toBe(true)
        })

        it('gives each client its own __propertiesObject__, with its own element overrides', () => {
            const { clients } = listOf(2, { someFunc: { value: () => 'some' } })
            const first = clients[0].__propertiesObject__
            expect(clients[0].__propertiesObject__).toBe(first)
            expect(clients[1].__propertiesObject__).not.toBe(first)
            expect(Object.keys(first)).toContain('someFunc')
            first.added = { value: 1 }
            expect(clients[1].__propertiesObject__.added).toBeUndefined()
            expect(first.__elementOverrides__.value).not.toBe(clients[1].__propertiesObject__.__elementOverrides__.value)
        })

        it('keeps all event functions of the map before the events of the client', () => {
            const events = Object.fromEntries(['on', 'off', 'emit', 'once', 'removeListener', 'removeAllListeners'].map((name) => [name, { value: vi.fn() }]))
            const { clients } = listOf(2, events)
            for (const name of Object.keys(events)) {
                clients[1][name]('custom', 1)
                expect(events[name].value).toHaveBeenCalledWith('custom', 1)
            }
        })

        it('gives each client its own events', () => {
            const { clients } = listOf(2, {})
            const onFirst = vi.fn()
            clients[0].on('custom', onFirst)
            clients[1].emit('custom', 1)
            expect(onFirst).not.toHaveBeenCalled()
            clients[0].emit('custom', 2)
            expect(onFirst).toHaveBeenCalledWith(2)
        })

        it('adds a command to one client only', () => {
            const { clients } = listOf(2, { someFunc: { value: () => 'some' } })
            clients[0].addCommand('newFunc', () => 'new')
            expect(clients[0].newFunc()).toBe('new')
            expect(clients[1].newFunc).toBeUndefined()
        })

        it('keeps the command of the list when a client adds a command with its name, as a client with its own commands does', () => {
            const { clients } = listOf(2, { someFunc: { value: () => 'some' } })
            clients[0].addCommand('someFunc', () => 'added')
            expect(clients[0].someFunc()).toBe('some')
            const single = webdriverMonad({}, (client: any) => client, { scope: { value: 'element' }, someFunc: { value: () => 'some' } })(sessionId)
            single.addCommand('someFunc', () => 'added')
            expect(single.someFunc()).toBe('some')
        })

        it('adds a command with the name of an object method to the client, as a client with its own commands does', () => {
            const { clients } = listOf(2, { someFunc: { value: () => 'some' } })
            clients[0].addCommand('toString', () => 'mine')
            expect(clients[0].toString()).toBe('mine')
            expect(clients[1].toString()).not.toBe('mine')
        })

        it('lets a command that a client adds replace an overwrite of that client, as a client with its own commands does', () => {
            const make = () => listOf(1, { someFunc: { value: () => 'some' } }).clients[0]
            const single = () => webdriverMonad({}, (client: any) => client, { scope: { value: 'element' }, someFunc: { value: () => 'some' } })(sessionId, (name: string, fn: Function) => fn)
            for (const client of [make(), single()]) {
                client.overwriteCommand('someFunc', (orig: Function) => `over:${orig()}`)
                client.addCommand('someFunc', () => 'added')
                expect(client.someFunc()).toBe('added')
            }
        })

        it('gives each client the options and the command wrapper of the list', () => {
            const listWrapper = vi.fn((name: string, fn: Function) => fn)
            const otherWrapper = vi.fn((name: string, fn: Function) => fn)
            const modifier = vi.fn((client: any) => client)
            const shared = shareCommands({ baseUrl: 'list' }, { scope: { value: 'element' }, someFunc: { value: () => 'some' } }, listWrapper)
            const client = webdriverMonad({ baseUrl: 'other' }, modifier, shared as never)(sessionId, otherWrapper)
            client.addCommand('added', () => 'added')
            client.overwriteCommand('someFunc', (orig: Function) => `over:${orig()}`)
            expect(otherWrapper).not.toHaveBeenCalled()
            expect(listWrapper.mock.calls.map(([name]) => name)).toEqual(['someFunc', 'added', 'someFunc'])
            expect(client.options).toEqual({ baseUrl: 'list' })
            expect(modifier.mock.calls[0][1]).toEqual({ baseUrl: 'list' })
        })

        it('overwrites a command of one client only', () => {
            const { clients } = listOf(2, { someFunc: { value: () => 'some' } })
            clients[0].overwriteCommand('someFunc', (orig: Function) => `over:${orig()}`)
            expect(clients[0].someFunc()).toBe('over:some')
            expect(clients[1].someFunc()).toBe('some')
        })
    })
})
