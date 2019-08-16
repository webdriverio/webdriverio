import {
    validate, getPrototype, findElement, findElements, switchFrame,
    sanitizeError, transformExecuteArgs, transformExecuteResult
} from '../src/utils'

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

let pageMock = {
    waitForSelector: jest.fn(),
    $$eval: jest.fn(),
    $$: jest.fn(),
    $: jest.fn()
}

describe('validate', () => {
    it('should fail if wrong arguments are passed in', () => {
        expect(() => validate(command.command, command.parameters, command.variables, command.refs, []))
            .toThrow(/Wrong parameters applied for findElementFromElement/)
    })

    it('should fail if arguments are malformed', () => {
        expect(() => validate(command.command, command.parameters, command.variables, command.refs, ['123', 123, '123']))
            .toThrow(/Malformed type for "using" parameter of command/)
    })

    it('should fail if not required param has wrong type', () => {
        expect(() => validate(command.command, command.parameters, command.variables, command.refs, ['123', '123', '123', 'foobar']))
            .toThrow(/Malformed type for "customParam" parameter of command/)
    })

    it('should do a proper request', () => {
        const body = validate(command.command, command.parameters, command.variables, command.refs, ['123', 'css selector', '#body', undefined])
        expect(body).toMatchSnapshot()
    })

    it('should do a proper request with non required params', () => {
        const body = validate(command.command, command.parameters, command.variables, command.refs, ['123', 'css selector', '#body', 123])
        expect(body).toMatchSnapshot()
    })
})

test('getPrototype', () => {
    let i = 0
    expect(getPrototype(() => ++i)).toMatchSnapshot()
})

describe('findElement utils', () => {
    afterEach(() => {
        pageMock.waitForSelector.mockClear()
        pageMock.$.mockClear()
        pageMock.$$.mockClear()
    })

    describe('findElement', () => {
        it('tries to find element', async () => {
            const scope = {
                timeouts: { get: jest.fn() },
                elementStore: { set: jest.fn().mockReturnValue('foobar') }
            }
            pageMock.$.mockReturnValue(Promise.resolve(42))
            expect(await findElement.call(scope, pageMock, 'barfoo'))
                .toEqual({ 'element-6066-11e4-a52e-4f735466cecf': 'foobar' })
            expect(pageMock.waitForSelector).toBeCalledTimes(0)
        })

        it('should fail if not found', async () => {
            const scope = {
                timeouts: { get: jest.fn() },
                elementStore: { set: jest.fn() }
            }
            pageMock.$.mockReturnValue(Promise.resolve(null))

            const errorMessage = await findElement.call(scope, pageMock, 'barfoo')
            expect(errorMessage.message)
                .toContain('Element with selector "barfoo" not found')
        })

        it('sets implicit waits', async () => {
            const scope = {
                timeouts: { get: jest.fn().mockReturnValue(1234) },
                elementStore: { set: jest.fn() }
            }
            pageMock.$.mockReturnValue(Promise.resolve('foobar'))
            await findElement.call(scope, pageMock, 'barfoo')
            expect(pageMock.waitForSelector).toBeCalledTimes(1)
        })
    })

    describe('findElements', () => {
        it('should find elements', async () => {
            const scope = {
                timeouts: { get: jest.fn() },
                elementStore: { set: jest.fn().mockReturnValue('foobar') }
            }
            pageMock.$$.mockReturnValue(Promise.resolve([42, 11]))
            expect(await findElements.call(scope, pageMock, 'barfoo')).toMatchSnapshot()
            expect(pageMock.waitForSelector).toBeCalledTimes(0)
        })

        it('should return immiadiatelly if no elements were found', async () => {
            const scope = {
                timeouts: { get: jest.fn() },
                elementStore: { set: jest.fn() }
            }
            pageMock.$$.mockReturnValue(Promise.resolve([]))
            expect(await findElements.call(scope, pageMock, 'barfoo')).toEqual([])
            expect(pageMock.waitForSelector).toBeCalledTimes(0)
            expect(scope.elementStore.set).toBeCalledTimes(0)
        })

        it('sets implicit waits', async () => {
            const scope = {
                timeouts: { get: jest.fn().mockReturnValue(1234) },
                elementStore: { set: jest.fn() }
            }
            pageMock.$$.mockReturnValue(Promise.resolve(['foobar']))
            await findElements.call(scope, pageMock, 'barfoo')
            expect(pageMock.waitForSelector).toBeCalledTimes(1)
        })
    })
})

test('switchFrame', () => {
    const scope = { windows: new Map() }
    switchFrame.call(scope, 'foobar')
    expect(typeof scope.currentWindowHandle).toBe('string')
    expect(scope.windows.get(scope.currentWindowHandle)).toBe('foobar')
})

describe('sanitizeError', () => {
    it('should set stale element error', () => {
        const err = new Error('Node is detached from document bla bla')
        expect(sanitizeError(err).stack)
            .toContain('stale element reference: The element reference is stale')
    })

    it('should not contain puppeteer traces', () => {
        const err = new Error('some error')
        err.stack = err.stack.split('\n')
        err.stack.push('at /foo/bar/devtools/node_modules/puppeteer-core/bla.js')
        err.stack = err.stack.join('\n')
        expect(sanitizeError(err)).not.toContain('devtools/node_modules/puppeteer-core')
    })
})

test('transformExecuteArgs', () => {
    const scope = { elementStore: new Map() }
    scope.elementStore.set('foobar', 'barfoo')

    expect(transformExecuteArgs.call(scope, [
        'foo',
        { 'element-6066-11e4-a52e-4f735466cecf': 'foobar' },
        true,
        42
    ])).toEqual(['foo', 'barfoo', true, 42])
})

describe('transformExecuteResult', () => {
    test('multiple results', async () => {
        const scope = {
            timeouts: { get: jest.fn() },
            elementStore: { set: jest.fn().mockReturnValue('foobar') }
        }
        pageMock.$.mockReturnValue(Promise.resolve(42))
        expect(await transformExecuteResult.call(scope, pageMock, [
            'foobar',
            '__executeElement',
            42
        ])).toMatchSnapshot()
    })

    test('single result', async () => {
        const scope = {
            timeouts: { get: jest.fn() },
            elementStore: { set: jest.fn().mockReturnValue('foobar') }
        }
        pageMock.$.mockReturnValue(Promise.resolve(42))
        expect(await transformExecuteResult.call(scope, pageMock, 'foobar'))
            .toEqual('foobar')
    })

    afterEach(() => {
        pageMock.waitForSelector.mockClear()
        pageMock.$.mockClear()
        pageMock.$$.mockClear()
        pageMock.$$eval.mockClear()
    })
})
