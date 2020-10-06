import { EventEmitter } from 'events'

import logger from '@wdio/logger'
import Protocols from '@wdio/protocols'

import commandWrapper from '../src/command'
import { BaseClient, WebDriverLogTypes } from '../src/types'

/**
 * workaround as typescript compiler uses expect-webdriverio as global
 */
const expect: jest.Expect = global.expect as unknown as jest.Expect

const commandPath = '/session/:sessionId/element/:elementId/element'
const commandMethod = 'POST'
const commandEndpoint: Protocols.CommandEndpoint = {
    command: 'findElementFromElement',
    ref: new URL('https://w3c.github.io/webdriver/webdriver-spec.html#dfn-find-element-from-element'),
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

jest.mock('../src/request', () => jest.fn().mockImplementation(
    () => ({
        makeRequest: jest.fn().mockReturnValue({
            then: jest.fn().mockImplementation(
                (then) => then)
        })
    })
))

class FakeClient extends EventEmitter {
    isW3C = false
    isChrome = false
    isAndroid = false
    isMobile = false
    isIOS = false
    isSauce = false
    isSeleniumStandalone = false
    sessionId = '123'
    capabilities = {}
    requestedCapabilities = {}
    options = {
        logLevel: 'warn' as WebDriverLogTypes
    }
}

const scope: BaseClient = new FakeClient()
type mockResponse = (...args: any[]) => any

describe('command wrapper', () => {
    it('should fail if wrong arguments are passed in', () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)
        expect(commandFn)
            .toThrow(/Wrong parameters applied for findElementFromElement/)
    })

    it('should fail if arguments are malformed', () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)
        expect(() => commandFn.call(scope, '123', 123, '123'))
            .toThrow(/Malformed type for "using" parameter of command/)
    })

    it('should fail if not required param has wrong type', () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)
        expect(() => commandFn.call(scope, '123', '123', '123', 'foobar'))
            .toThrow(/Malformed type for "customParam" parameter of command/)
    })

    it('should throw if param type within array is not met', async () => {
        expect.assertions(1)
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)

        try {
            commandFn.call(scope, '123', '123', '123', 234, () => {})
        } catch (err) {
            expect(err.message).toContain('Actual: (function)[]')
        }
    })

    it('should do a proper request', () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)
        const requestMock = require('../src/request')
        const resultFunction = commandFn.call(scope, '123', 'css selector', '#body', undefined) as unknown as mockResponse
        expect(requestMock.mock.calls).toHaveLength(1)
        expect(resultFunction({ value: 14 })).toBe(14)

        const [method, endpoint, { using, value }] = requestMock.mock.calls[0]
        expect(method).toBe('POST')
        expect(endpoint).toBe('/session/:sessionId/element/123/element')
        expect(using).toBe('css selector')
        expect(value).toBe('#body')
        requestMock.mockClear()
    })

    it('should do a proper request with non required params', () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)
        const requestMock = require('../src/request')
        const resultFunction = commandFn.call(scope, '123', 'css selector', '#body', 123) as unknown as mockResponse
        expect(requestMock.mock.calls).toHaveLength(1)
        expect(resultFunction({ value: 'foobarboo' })).toBe('foobarboo')

        const [method, endpoint, { using, value, customParam }] = requestMock.mock.calls[0]
        expect(method).toBe('POST')
        expect(endpoint).toBe('/session/:sessionId/element/123/element')
        expect(using).toBe('css selector')
        expect(value).toBe('#body')
        expect(customParam).toBe(123)
        requestMock.mockClear()
    })

    it('should encode uri parameters', () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint)
        const requestMock = require('../src/request')
        commandFn.call(scope, '/path', 'css selector', '#body', 123)

        const [, endpoint] = requestMock.mock.calls[0]
        expect(endpoint).toBe('/session/:sessionId/element/%2Fpath/element')
        requestMock.mockClear()
    })

    it('should double encode uri parameters if using selenium', () => {
        const commandFn = commandWrapper(commandMethod, commandPath, commandEndpoint, true)
        const requestMock = require('../src/request')
        commandFn.call(scope, '/path', 'css selector', '#body', 123)

        const [, endpoint] = requestMock.mock.calls[0]
        expect(endpoint).toBe('/session/:sessionId/element/%252Fpath/element')
        requestMock.mockClear()
    })
})

describe('command wrapper result log', () => {
    const log = logger('webdriver')
    jest.spyOn(log, 'info').mockImplementation((string) => string)

    function getRequestCallback (method: string, path: string, endpoint: Protocols.CommandEndpoint) {
        const commandFn = commandWrapper(method, path, endpoint)
        const requestMock = require('../src/request')
        const resultFunction = commandFn.call(scope)
        expect(requestMock.mock.calls).toHaveLength(1)

        requestMock.mockClear()
        ;(log.info as jest.Mock).mockClear()

        return resultFunction
    }

    const takeScreenshotCmd = {
        path: '/foobar',
        method: 'GET',
        endpoint: {
            command: 'takeScreenshot',
            ref: new URL('https://foobar.com'),
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
        get log() { return this.value }
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
        get log() { return this.value }
    }, {
        title: 'do nothing to non string value: array',
        command: { ...takeScreenshotCmd },
        value: [],
        get log() { return this.value }
    }, {
        title: 'do nothing to non string value: object',
        command: { ...takeScreenshotCmd },
        value: {},
        get log() { return this.value }
    }, {
        title: 'do nothing to non string value: number',
        command: { ...takeScreenshotCmd },
        value: 3,
        get log() { return this.value }
    }, {
        title: 'do nothing to non string value: boolean',
        command: { ...takeScreenshotCmd },
        value: false,
        get log() { return this.value }
    }]

    for (const scenario of scenarios) {
        it(`should ${scenario.title} for ${scenario.command.endpoint.command}`, () => {
            const resultFunction = getRequestCallback(scenario.command.method, scenario.command.path, scenario.command.endpoint) as unknown as mockResponse
            resultFunction({ value: scenario.value })
            expect((log.info as jest.Mock).mock.calls[0][1]).toBe(scenario.log)
        })
    }

    it('should be no result in log if there is value in response', () => {
        const resultFunction = getRequestCallback(takeScreenshotCmd.method, takeScreenshotCmd.path, takeScreenshotCmd.endpoint) as unknown as mockResponse
        resultFunction({})
        expect((log.info as jest.Mock).mock.calls).toHaveLength(0)
    })
})
