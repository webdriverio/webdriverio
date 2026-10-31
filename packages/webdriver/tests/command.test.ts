import path from 'node:path'
import { EventEmitter } from 'node:events'

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import logger from '@wdio/logger'
import type { CommandEndpoint } from '@wdio/protocols'
import type { Options } from '@wdio/types'

import '../src/browser.js'
import { environment } from '../src/environment.js'
import { SESSION_ENDED_ERROR } from '../src/constants.js'
// @ts-expect-error mock feature
import { WebDriverRequest as RequestMock, thenMock, catchMock, makeRequestMock, getCapturedRequestHandler } from '../src/request/request.js'
import commandWrapper from '../src/command.js'
import type { BaseClient, WebDriverResultEvent } from '../src/types.js'
import { CommandRuntimeOptions } from '../src/types.js'
import type { RequestEventHandler } from '../build/request/types.js'
import type { RequestOptions } from '../src/request/types.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('fetch')

const log = logger('webdriver')
const commandPath = '/session/:sessionId/element/:elementId/element'
const commandMethod = 'POST'
const commandEndpoint: CommandEndpoint = {
    command: 'findElementFromElement',
    ref: 'https://w3c.github.io/webdriver/webdriver-spec.html#dfn-find-element-from-element',
    description: '',
    variables: [{
        name: 'elementId',
        description: 'the id of an element returned in a previous call to Find Element(s)'
    }],
    parameters: [{
        name: 'using',
        type: 'string',
        description: 'a valid element location strategy',
        required: true
    }, {
        name: 'value',
        type: 'string',
        description: 'the actual selector that will be used to find an element',
        required: true
    }, {
        name: 'customParam',
        type: 'number',
        description: 'a random not required param',
        required: false
    }, {
        name: 'customArrayParam',
        type: '(string|object|number|boolean|undefined)[]',
        description: 'a random not required param',
        required: false
    }]
}

const requestHandler = {
    onPerformance: expect.any(Function),
    onRequest: expect.any(Function),
    onResponse: expect.any(Function),
    onRetry: expect.any(Function),
    onLogData: expect.any(Function)
}

vi.mock('../src/request/request', () => {
    const thenMock = vi.fn()
    const finallyMock = vi.fn()
    const catchMock = vi.fn().mockReturnValue({ finally: finallyMock })

    const promise = { then: thenMock, catch: catchMock, finally: finallyMock }

    const makeRequestMock = vi.fn().mockReturnValue(promise)
    thenMock.mockReturnValue(promise)

    const capturedRequestEventHandler = vi.fn<() => RequestEventHandler>()

    // Mock the constructor
    const WebDriverRequest = vi.fn().mockImplementation(function (
        _method, _endpoint, _body, _abortSignal, _isHubCommand, requestEventHandler: RequestEventHandler
    ) {
        capturedRequestEventHandler.mockReturnValue(requestEventHandler)
        return { makeRequest: makeRequestMock }
    })

    return {
        thenMock,
        catchMock,
        finallyMock,
        WebDriverRequest,
        makeRequestMock,
        getCapturedRequestHandler: capturedRequestEventHandler
    }
})

class FakeClient extends EventEmitter {
    isChromium = false
    isAndroid = false
    isMobile = false
    isIOS = false
    isSauce = false
    isFirefox = false
    isBidi = false
    isWindowsApp = false
    isMacApp = false
    isSeleniumStandalone = false
    isNativeContext = false
    mobileContext = ''
    sessionId = '123'
    capabilities = {}
    requestedCapabilities = {}
    options = {
        logLevel: 'warn' as Options.WebDriverLogTypes,
        headers: {
            'custom-header': 'custom-value'
        },
    } as Partial<RequestOptions>
    emit = vi.fn()
    on = vi.fn()
}

const scope: BaseClient = new FakeClient()
type mockResponse = (...args: any[]) => any

describe('command wrapper', () => {
    beforeEach(() => {
        vi.mocked(log.warn).mockClear()
        vi.mocked(log.info).mockClear()
        vi.mocked(scope.emit).mockClear()
        vi.mocked(scope.on).mockClear()
        vi.mocked(thenMock).mockClear()
        vi.mocked(catchMock).mockClear()
        vi.mocked(getCapturedRequestHandler).mockClear()
    })

    it('should fail if wrong arguments are passed in', async () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint).bind({} as unknown)
        await expect(commandFn)
            .rejects
            .toThrow(/Wrong parameters applied for findElementFromElement/)
    })

    it('should fail if arguments are malformed', async () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)
        await expect(() => commandFn.call(scope, '123', 123, '123'))
            .rejects
            .toThrow(/Malformed type for "using" parameter of command/)
    })

    it('should fail if not required param has wrong type', async () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)
        await expect(() => commandFn.call(scope, '123', '123', '123', 'foobar'))
            .rejects
            .toThrow(/Malformed type for "customParam" parameter of command/)
    })

    it('should throw if param type within array is not met', async () => {
        expect.assertions(1)
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)

        await expect(commandFn.call(scope, '123', '123', '123', 234, () => {}))
            .rejects
            .toThrow(/Actual: \(function\)\[\]/)
    })

    it('should do a proper request', async () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)
        await commandFn.call(scope, '123', 'css selector', '#body', undefined) as unknown as mockResponse
        const thenCallback = thenMock.mock.calls[0][0]
        expect(thenCallback({ value: 14 })).toBe(14)
        vi.mocked(thenMock).mockClear()

        expect(RequestMock).toHaveBeenCalledWith(
            'POST',
            '/session/:sessionId/element/123/element',
            {
                using: 'css selector',
                value: '#body'
            },
            expect.any(AbortSignal),
            false,
            requestHandler
        )
    })

    it('should do a proper request with non required params', async () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)
        await commandFn.call(scope, '123', 'css selector', '#body', 123) as unknown as mockResponse
        expect(RequestMock).toHaveBeenCalledWith(
            'POST',
            '/session/:sessionId/element/123/element',
            {
                using: 'css selector',
                value: '#body',
                customParam: 123
            },
            expect.any(AbortSignal),
            false,
            requestHandler
        )
    })

    it('should encode uri parameters', async () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)
        await commandFn.call(scope, '/path', 'css selector', '#body', 123)

        expect(RequestMock).toHaveBeenCalledWith(
            'POST',
            '/session/:sessionId/element/%2Fpath/element',
            expect.anything(),
            expect.any(AbortSignal),
            false,
            requestHandler
        )
    })

    it('should double encode uri parameters if using selenium', async () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint, true)
        await commandFn.call(scope, '/path', 'css selector', '#body', 123)

        expect(RequestMock).toHaveBeenCalledWith(
            'POST',
            '/session/:sessionId/element/%252Fpath/element',
            expect.anything(),
            expect.any(AbortSignal),
            false,
            requestHandler
        )
        expect(log.warn).toHaveBeenCalledTimes(0)
    })

    it('should register abort listener', async () => {
        scope.sessionId = '456' // Emulate new session
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint, true)
        await commandFn.call(scope, '/path', 'css selector', '#body', 123)

        expect(scope.on).toHaveBeenCalledTimes(1)
        expect(scope.on).toHaveBeenLastCalledWith('result', expect.any(Function))
    })

    it('names the error of a command after deleteSession as a session end', async () => {
        scope.sessionId = 'deleted-session'
        vi.mocked(scope.on).mockClear()
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint, true)
        await commandFn.call(scope, '/path', 'css selector', '#body', 123)
        const onResult = vi.mocked(scope.on).mock.calls.find(([event]) => event === 'result')![1] as (result: { command: string }) => void
        onResult({ command: 'deleteSession' })

        const error = await (commandFn.call(scope, '/path', 'css selector', '#body', 123) as Promise<unknown>).catch((err: Error) => err) as Error
        expect(error.message).toContain('after session has been deleted')
        expect(error.name).toBe(SESSION_ENDED_ERROR)
    })

    it('should register abort listener once when request was called multiple times', async () => {
        scope.sessionId = '789' // Emulate new session
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint, true)
        await commandFn.call(scope, '/path', 'css selector', '#body', 123)
        await commandFn.call(scope, '/path', 'css selector', '#body', 123)

        expect(scope.on).toHaveBeenCalledTimes(1)
    })

    it('should log deprecation notice', async () => {
        const deprecatedCommandEndpoint = {
            deprecated: 'This command will soon be deprecated.',
            ...commandEndpoint
        }
        const commandFn = commandWrapper(commandMethod, commandPath, deprecatedCommandEndpoint)
        await commandFn.call(scope, '123', 'css selector', '#body', undefined) as unknown as mockResponse
        expect(log.warn).toBeCalledWith('The "findElementFromElement" command will soon be deprecated.')
    })

    it('should emit result when request throws', async () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)
        await commandFn.call(scope, '/path', 'css selector', '#body')

        const errorCallback = catchMock.mock.calls[0][0]

        const error = new Error('Request failed')
        expect(() => errorCallback(error)).toThrow(error)
        expect(scope.emit).toBeCalledWith('result', {
            command: 'findElementFromElement',
            method: 'POST',
            endpoint: '/session/:sessionId/element/%2Fpath/element',
            body: { using: 'css selector', value: '#body' },
            result: { error }
        })
    })

    describe('waitUntil of the result event', () => {
        const run = async (listener: (event: WebDriverResultEvent) => void) => {
            vi.mocked(thenMock).mockClear()
            vi.mocked(scope.emit).mockImplementation(((name: string, event: WebDriverResultEvent) => {
                if (name === 'result') {
                    listener(event)
                }
                return true
            }) as never)
            const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)
            await commandFn.call(scope, '/path', 'css selector', '#body')
            const onSuccess = thenMock.mock.calls[0][0] as (result: { value: unknown }) => unknown
            // in an object: `await run()` would wait for a returned promise
            return { returned: onSuccess({ value: 'the value' }) }
        }
        afterEach(() => {
            vi.mocked(scope.emit).mockReset()
        })

        it('resolves the command after the promise of a listener', async () => {
            let finish!: () => void
            const order: string[] = []
            const { returned: value } = await run((event) => event.waitUntil!(new Promise<void>((resolve) => {
                finish = () => {
                    order.push('listener done')
                    resolve()
                }
            })))
            expect(value).toBeInstanceOf(Promise)
            ;(value as Promise<unknown>).then(() => order.push('command resolved'))
            await Promise.resolve()
            expect(order).toEqual([])
            finish()
            await expect(value).resolves.toBe('the value')
            expect(order).toEqual(['listener done', 'command resolved'])
        })

        it('returns the value at once when no listener waits', async () => {
            expect((await run(() => {})).returned).toBe('the value')
        })

        it('logs a failed listener promise and still resolves the command', async () => {
            vi.mocked(log.warn).mockClear()
            const { returned: value } = await run((event) => event.waitUntil!(Promise.reject(new Error('switch failed'))))
            await expect(value).resolves.toBe('the value')
            expect(log.warn).toBeCalledWith('A listener of the "findElementFromElement" result failed: switch failed')
        })

        it('is not in a copy or a serialization of the event', async () => {
            let copy: unknown, json = ''
            await run((event) => {
                expect(typeof event.waitUntil).toBe('function')
                copy = { ...event }
                json = JSON.stringify(event)
            })
            expect(copy).not.toHaveProperty('waitUntil')
            expect(json).not.toContain('waitUntil')
        })
    })

    describe('masking command', () => {
        const maskCommandEndpoint: CommandEndpoint = {
            command: 'elementSendKeys',
            ref: 'https://w3c.github.io/webdriver/#dfn-element-send-keys',
            description: '',
            variables: [{
                name: 'elementId',
                description: 'the id of an element returned in a previous call to Find Element(s)'
            }],
            parameters: [{
                name: 'text',
                type: 'string',
                description: 'the text to be sent to the element',
                required: true
            }]
        }
        const elementId = '123'
        const text = 'mySecretPassword'
        const runtimeOptionsWithMasking = new CommandRuntimeOptions({ mask: true })

        it('should do the http request with the unmasked text when masking is requested', async () => {
            const commandFn = commandWrapper(commandMethod, commandPath, maskCommandEndpoint)

            await commandFn.call(scope, elementId, text, runtimeOptionsWithMasking)

            expect(RequestMock).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                {
                    text: 'mySecretPassword',
                },
                expect.any(AbortSignal),
                false,
                requestHandler
            )
        })

        it('should hand the masked body to the request so errors never show the text', async () => {
            const commandFn = commandWrapper(commandMethod, commandPath, maskCommandEndpoint)

            await commandFn.call(scope, elementId, text, runtimeOptionsWithMasking)

            const request = vi.mocked(RequestMock).mock.instances.at(-1) as unknown as { maskedBody?: unknown }
            expect(request.maskedBody).toEqual({ text: '**MASKED**' })
        })

        it('should not set a masked body when masking is not requested', async () => {
            const commandFn = commandWrapper(commandMethod, commandPath, maskCommandEndpoint)

            await commandFn.call(scope, elementId, text)

            const request = vi.mocked(RequestMock).mock.instances.at(-1) as unknown as { maskedBody?: unknown }
            expect(request.maskedBody).toBeUndefined()
        })

        it('should emit "result" with masked text on success', async () => {
            const protocolCommandFunction = commandWrapper(commandMethod, commandPath, maskCommandEndpoint)

            const test = await protocolCommandFunction.call(scope, elementId, text, runtimeOptionsWithMasking)
            vi.mocked(scope.emit).mockClear()
            const thenCallback = thenMock.mock.calls[0][0]

            thenCallback({})

            expect(scope.emit).toBeCalledWith('result', expect.objectContaining({
                body: { text: '**MASKED**' },
            }))
        })

        it('should emit "result" with masked text on error', async () => {
            const protocolCommandFunction = commandWrapper(commandMethod, commandPath, maskCommandEndpoint)

            const test = await protocolCommandFunction.call(scope, elementId, text, runtimeOptionsWithMasking)
            vi.mocked(scope.emit).mockClear()
            const errorCallback = catchMock.mock.calls[0][0]

            const error = new Error('Request failed')
            expect(() => errorCallback(error)).toThrow(error)
            expect(scope.emit).toBeCalledWith('result', expect.objectContaining({
                body: { text: '**MASKED**' },
            }))
        })

        it('should emit "command" with masked text', async () => {
            const protocolCommandFunction = commandWrapper(commandMethod, commandPath, maskCommandEndpoint)

            await protocolCommandFunction.call(scope, elementId, text, runtimeOptionsWithMasking)

            expect(scope.emit).toBeCalledWith('command', expect.objectContaining({
                body: { text: '**MASKED**' },
            }))
        })

        it('should emit "request.performance" with masked text when using the RequestEventHandler.onPerformance', async () => {
            const protocolCommandFunction = commandWrapper(commandMethod, commandPath, maskCommandEndpoint)

            await protocolCommandFunction.call(scope, elementId, text, runtimeOptionsWithMasking)
            vi.mocked(scope.emit).mockClear()
            getCapturedRequestHandler().onPerformance({ data: 'data', request: { body: { text: 'mySecretPassword' } } })

            expect(scope.emit).toBeCalledWith('request.performance', expect.objectContaining({
                request: { body: { text: '**MASKED**' } },
            }))
        })

        it('should emit "request.start" with masked text when using the RequestEventHandler.onRequest', async () => {
            const protocolCommandFunction = commandWrapper(commandMethod, commandPath, maskCommandEndpoint)

            await protocolCommandFunction.call(scope, elementId, text, runtimeOptionsWithMasking)
            vi.mocked(scope.emit).mockClear()
            getCapturedRequestHandler().onRequest({ data: 'data',  body: { text: 'mySecretPassword' }  })

            expect(scope.emit).toBeCalledWith('request.start', expect.objectContaining(
                { body: { text: '**MASKED**' } }
            ))
        })

        it('should log "DATA" with masked text when using the RequestEventHandle.onLogData', async () => {
            const protocolCommandFunction = commandWrapper(commandMethod, commandPath, maskCommandEndpoint)

            await protocolCommandFunction.call(scope, elementId, text, runtimeOptionsWithMasking)
            vi.mocked(scope.emit).mockClear()
            getCapturedRequestHandler().onLogData({ text: 'mySecretPassword' })

            expect(log.info).toBeCalledWith('DATA', { text: '**MASKED**' })
        })

        it('should log "COMMAND" with masked text', async () => {
            const protocolCommandFunction = commandWrapper(commandMethod, commandPath, maskCommandEndpoint)

            await protocolCommandFunction.call(scope, elementId, text, runtimeOptionsWithMasking)

            expect(log.info).toBeCalledWith('COMMAND', 'elementSendKeys("123", "**MASKED**")')
        })

        it('should makeRequest with the appium header for sensitive data', async () => {
            const protocolCommandFunction = commandWrapper(commandMethod, commandPath, maskCommandEndpoint)

            await protocolCommandFunction.call(scope, elementId, text, runtimeOptionsWithMasking)
            expect(makeRequestMock).toHaveBeenCalledWith(expect.objectContaining(
                { headers: {
                    'custom-header': 'custom-value',
                    'x-appium-is-sensitive': 'true'
                } }
            ), expect.any(String))
            expect(scope.options.headers).toEqual({
                'custom-header': 'custom-value',
            })
        })

    })
})

describe('command wrapper result log', () => {
    async function getRequestCallback (method: string, path: string, endpoint: CommandEndpoint) {
        const commandFn = commandWrapper(method, path, endpoint)
        await commandFn.call(scope)
        expect(RequestMock).toHaveBeenCalledTimes(1)
        expect(RequestMock).toHaveBeenCalledWith(method, path, expect.any(Object), expect.any(AbortSignal), false, requestHandler)

        const callback = thenMock.mock.calls[0][0]

        vi.mocked(thenMock).mockClear()
        vi.mocked(log.info).mockClear()

        return callback
    }

    const takeScreenshotCmd = {
        path: '/foobar',
        method: 'GET',
        endpoint: {
            command: 'takeScreenshot',
            ref: 'https://foobar.com',
            parameters: [],
            description: ''
        }
    }

    const deleteSessionCmd = {
        path: '/foobar',
        method: 'POST',
        endpoint: {
            command: 'deleteSession',
            ref: 'https://foobar.com',
            parameters: [],
            description: ''
        }
    }

    const scenarios = [{
        title: 'truncate long string value',
        command: { ...takeScreenshotCmd },
        value: 'f'.repeat(65),
        log: 'f'.repeat(61) + '...'
    }, {
        title: 'truncate long string value',
        command: {
            ...takeScreenshotCmd,
            endpoint: {
                ...takeScreenshotCmd.endpoint,
                command: 'takeElementScreenshot'
            }
        },
        value: 'f'.repeat(123),
        log: 'f'.repeat(61) + '...'
    }, {
        title: 'truncate long string value',
        command: {
            ...takeScreenshotCmd,
            endpoint: {
                ...takeScreenshotCmd.endpoint,
                command: 'startRecordingScreen'
            }
        },
        value: 'f'.repeat(123),
        log: 'f'.repeat(61) + '...'
    }, {
        title: 'truncate long string value',
        command: {
            ...takeScreenshotCmd,
            endpoint: {
                ...takeScreenshotCmd.endpoint,
                command: 'stopRecordingScreen'
            }
        },
        value: 'f'.repeat(123),
        log: 'f'.repeat(61) + '...'
    }, {
        title: 'do nothing to values with length less then 65',
        command: { ...takeScreenshotCmd },
        value: 'f'.repeat(64),
        get log () { return this.value }
    }, {
        title: 'not truncate long string value',
        command: {
            ...takeScreenshotCmd,
            endpoint: {
                ...takeScreenshotCmd.endpoint,
                command: 'any-other-command'
            }
        },
        value: 'f'.repeat(66),
        get log () { return this.value }
    }, {
        title: 'do nothing to non string value: array',
        command: { ...takeScreenshotCmd },
        value: [],
        get log () { return this.value }
    }, {
        title: 'do nothing to non string value: object',
        command: { ...takeScreenshotCmd },
        value: {},
        get log () { return this.value }
    }, {
        title: 'do nothing to non string value: number',
        command: { ...takeScreenshotCmd },
        value: 3,
        get log () { return this.value }
    }, {
        title: 'do nothing to non string value: boolean',
        command: { ...takeScreenshotCmd },
        value: false,
        get log () { return this.value }
    }]

    logger.clearLogger = vi.fn()
    const clearLoggerSpy = vi.spyOn(logger, 'clearLogger')

    beforeEach(() => {
        delete environment.value.variables.WDIO_WORKER_ID
        vi.clearAllMocks()
    })

    for (const scenario of scenarios) {
        it(`should ${scenario.title} for ${scenario.command.endpoint.command}`, async () => {
            const resultFunction = await getRequestCallback(
                scenario.command.method,
                scenario.command.path,
                scenario.command.endpoint
            ) as unknown as mockResponse

            resultFunction({ value: scenario.value })
            expect(vi.mocked(log.info).mock.calls[0][1]).toBe(scenario.log)
            expect(clearLoggerSpy).not.toHaveBeenCalled()
        })
    }

    it('does not clear the logger when deleteSession runs inside a worker', async () => {
        environment.value.variables.WDIO_WORKER_ID = '0-0'
        const resultFunction = await getRequestCallback(
            deleteSessionCmd.method,
            deleteSessionCmd.path,
            deleteSessionCmd.endpoint
        ) as unknown as mockResponse
        resultFunction({})
        expect(vi.mocked(log.info).mock.calls).toHaveLength(0)
        expect(clearLoggerSpy).not.toHaveBeenCalled()
    })

    it('should call clearLogger on deleteSession cmd', async () => {
        const resultFunction = await getRequestCallback(
            deleteSessionCmd.method,
            deleteSessionCmd.path,
            deleteSessionCmd.endpoint
        ) as unknown as mockResponse
        await resultFunction({})
        expect(vi.mocked(log.info).mock.calls).toHaveLength(0)
        expect(clearLoggerSpy).toHaveBeenCalledTimes(1)
    })
})

describe('deleteSession clean up', () => {
    const deleteSessionEndpoint = {
        command: 'deleteSession',
        ref: 'https://w3c.github.io/webdriver/#dfn-delete-session',
        parameters: [{ name: 'deleteSessionOpts', type: 'object', description: '', required: false }],
        description: ''
    }

    function createScope () {
        const client = new FakeClient() as unknown as BaseClient & { _bidiHandler: { close: () => void } }
        client.capabilities = { 'wdio:driverPID': 1234 } as WebdriverIO.Capabilities
        client.requestedCapabilities = { browserName: 'chrome' } as WebdriverIO.Capabilities
        client._bidiHandler = { close: vi.fn() }
        return client
    }

    async function runDeleteSession (client: BaseClient, ...args: unknown[]) {
        vi.mocked(thenMock).mockClear()
        vi.mocked(catchMock).mockClear()
        const commandFn = commandWrapper('DELETE', '/session/:sessionId', deleteSessionEndpoint)
        await commandFn.call(client, ...args)
        return {
            onResult: thenMock.mock.calls[0][0] as mockResponse,
            onError: catchMock.mock.calls[0][0] as mockResponse
        }
    }

    beforeEach(() => {
        delete environment.value.variables.WDIO_WORKER_ID
        logger.clearLogger = vi.fn()
        environment.value.killDriverProcess = vi.fn()
    })

    it('kills the driver and closes the Bidi socket when the session is deleted', async () => {
        const client = createScope()
        const { onResult } = await runDeleteSession(client)
        await onResult({ value: null })
        expect(environment.value.killDriverProcess).toHaveBeenCalledWith(client.capabilities, true, client.requestedCapabilities)
        expect(client._bidiHandler.close).toHaveBeenCalledTimes(1)
        expect(logger.clearLogger).toHaveBeenCalledTimes(1)
    })

    it('resolves deleteSession only after the driver is killed', async () => {
        const client = createScope()
        let killed!: () => void
        environment.value.killDriverProcess = vi.fn(() => new Promise<void>((resolve) => { killed = resolve }))
        const { onResult } = await runDeleteSession(client)
        let resolved = false
        const result = onResult({ value: null }).then(() => { resolved = true })
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(resolved).toBe(false)
        killed()
        await result
        expect(resolved).toBe(true)
    })

    it('still kills the driver and closes the Bidi socket when deleteSession fails, then throws', async () => {
        const client = createScope()
        const { onError } = await runDeleteSession(client)
        const error = new Error('invalid session id: A session is either terminated or not started')
        await expect(onError(error)).rejects.toThrow(error)
        // the driver did not delete its profile: no wait for it
        expect(environment.value.killDriverProcess).toHaveBeenCalledWith(client.capabilities, true, undefined)
        expect(client._bidiHandler.close).toHaveBeenCalledTimes(1)
        expect(logger.clearLogger).toHaveBeenCalledTimes(1)
    })

    it('keeps the driver running on a failed deleteSession with shutdownDriver: false', async () => {
        const client = createScope()
        const { onError } = await runDeleteSession(client, { shutdownDriver: false })
        await expect(onError(new Error('fetch failed'))).rejects.toThrow('fetch failed')
        expect(environment.value.killDriverProcess).toHaveBeenCalledWith(client.capabilities, false, undefined)
    })

    it('cleans up only once when the result handler already did it', async () => {
        const client = createScope()
        const { onResult, onError } = await runDeleteSession(client)
        await onResult({ value: null })
        await expect(onError(new Error('later failure'))).rejects.toThrow('later failure')
        expect(environment.value.killDriverProcess).toHaveBeenCalledTimes(1)
        expect(client._bidiHandler.close).toHaveBeenCalledTimes(1)
    })

    it('does not clean up when another command fails', async () => {
        const client = createScope()
        vi.mocked(thenMock).mockClear()
        vi.mocked(catchMock).mockClear()
        const commandFn = commandWrapper('GET', '/session/:sessionId/title', { command: 'getTitle', ref: '', parameters: [], description: '' })
        await commandFn.call(client)
        const onError = catchMock.mock.calls[0][0] as mockResponse
        expect(() => onError(new Error('boom'))).toThrow('boom')
        expect(environment.value.killDriverProcess).not.toHaveBeenCalled()
        expect(client._bidiHandler.close).not.toHaveBeenCalled()
    })
})
