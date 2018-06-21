import commandWrapper from '../src/command'

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
        makeRequest: jest.fn().mockReturnValue({ then: jest.fn().mockImplementation(
            (then) => {
                expect(then({ value: 'foobarboo' })).toBe('foobarboo')
            })
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
        commandFn.call(scope, '123', 'css selector', '#body', undefined)
        expect(requestMock.mock.calls).toHaveLength(1)

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
        commandFn.call(scope, '123', 'css selector', '#body', 123)
        expect(requestMock.mock.calls).toHaveLength(1)

        const [method, endpoint, { using, value, customParam }] = requestMock.mock.calls[0]
        expect(method).toBe('POST')
        expect(endpoint).toBe('/session/:sessionId/element/123/element')
        expect(using).toBe('css selector')
        expect(value).toBe('#body')
        expect(customParam).toBe(123)
        requestMock.mockClear()
    })
})
