import commandWrapper from '../src/command'
import logger from '@wdio/logger'

const command = {
    endpoint: '/session/:sessionId/element/:elementId/element',
    method: 'POST',
    command: 'findElementFromElement',
    ref: 'https://w3c.github.io/webdriver/webdriver-spec.html#dfn-find-element-from-element',
    variables: [{
        'name': 'elementId',
        'description': 'the id of an element returned in a previous call to Find Element(s)'
    }],
    parameters: [{
        'name': 'using',
        'type': 'string',
        'description': 'a valid element location strategy',
        'required': true
    }, {
        'name': 'value',
        'type': 'string',
        'description': 'the actual selector that will be used to find an element',
        'required': true
    }, {
        'name': 'customParam',
        'type': 'number',
        'description': 'a random not required param',
        'required': false
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

const scope = { emit: jest.fn() }

describe('command wrapper', () => {
    it('should fail if wrong arguments are passed in', () => {
        const commandFn = commandWrapper(command.method, command.endpoint, command)
        expect(commandFn).toThrow(/Wrong parameters applied for findElementFromElement/)
    })

    it('should fail if arguments are malformed', () => {
        const commandFn = commandWrapper(command.method, command.endpoint, command)
        expect(() => commandFn('123', 123, '123')).toThrow(/Malformed type for "using" parameter of command/)
    })

    it('should fail if not required param has wrong type', () => {
        const commandFn = commandWrapper(command.method, command.endpoint, command)
        expect(() => commandFn('123', '123', '123', 'foobar')).toThrow(/Malformed type for "customParam" parameter of command/)
    })

    it('should do a proper request', () => {
        const commandFn = commandWrapper(command.method, command.endpoint, command)
        const requestMock = require('../src/request')
        const resultFunction = commandFn.call(scope, '123', 'css selector', '#body', undefined)
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
        const commandFn = commandWrapper(command.method, command.endpoint, command)
        const requestMock = require('../src/request')
        const resultFunction = commandFn.call(scope, '123', 'css selector', '#body', 123)
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
})

describe('command wrapper result log', () => {
    const log = logger('webdriver')
    jest.spyOn(log, 'info').mockImplementation((string) => string)

    function getRequestCallback(params) {
        const commandFn = commandWrapper(params.method, params.endpoint, params)
        const requestMock = require('../src/request')
        const resultFunction = commandFn.call(scope)
        expect(requestMock.mock.calls).toHaveLength(1)

        requestMock.mockClear()
        log.info.mockClear()

        return resultFunction
    }

    const takeScreenshotCmd = {
        command: 'takeScreenshot',
        endpoint: '/foobar',
        method: 'GET',
        ref: 'foobar',
        parameters: []
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
            command: 'takeElementScreenshot'
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
            command: 'any-other-command'
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
        it(`should ${scenario.title} for ${scenario.command.command}`, () => {
            const resultFunction = getRequestCallback(scenario.command)
            resultFunction({ value: scenario.value })
            expect(log.info.mock.calls[0][1]).toBe(scenario.log)
        })
    }

    it('should be no result in log if there is value in response', () => {
        const resultFunction = getRequestCallback(takeScreenshotCmd)
        resultFunction({})
        expect(log.info.mock.calls).toHaveLength(0)
    })
})
