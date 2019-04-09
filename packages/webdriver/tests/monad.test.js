import webdriverMonad from '../src/monad'

const prototype = {
    someFunc: { value: jest.fn().mockImplementation((arg) => `result-${arg.toString()}`) }
}
const sessionId = 'c5fa4320-07d5-48f5-b7c2-922d4405e17f'

describe('monad', () => {
    it('should be able to initialize client with prototype with commands', () => {
        const modifier = jest.fn()
        const monad = webdriverMonad({ some: 'option' }, (client) => {
            modifier()
            return client
        }, prototype)
        const client = monad(sessionId)

        expect(client.sessionId).toBe(sessionId)
        expect(client.options).toEqual({ some: 'option' })
        expect(client.commandList).toHaveLength(1)
        expect(client.commandList[0]).toBe('someFunc')

        client.someFunc(123)
        expect(prototype.someFunc.value.mock.calls).toHaveLength(1)
        expect(prototype.someFunc.value.mock.calls[0][0]).toBe(123)
        expect(client.constructor.name).toBe('Browser')
    })

    it('should allow to set element scope name', () => {
        prototype.scope = 'element'
        const monad = webdriverMonad({ isW3C: true }, (client) => client, prototype)
        const client = monad(sessionId)
        expect(client.constructor.name).toBe('Element')
    })

    it('should allow to extend base prototype', () => {
        const monad = webdriverMonad({ isW3C: true }, (client) => client, prototype)
        const commandWrapperMock = jest.fn().mockImplementation((name, fn) => fn)
        const client = monad(sessionId, commandWrapperMock)
        const fn = () => 'bar'

        client.addCommand('foo', fn)
        expect(client.foo()).toBe('bar')
    })

    it('should add element commands to the __propertiesObject__ cache', () => {
        const monad = webdriverMonad({ isW3C: true }, (client) => client, prototype)
        const client = monad(sessionId)

        const func = function (x, y) { return x + y }

        client.addCommand('myCustomElementCommand', func, true)
        expect(typeof client.__propertiesObject__.myCustomElementCommand).toBe('object')
        expect(client.__propertiesObject__.myCustomElementCommand.value).toBe(func)
    })

    it('should add element commands to the __propertiesObject__ cache in multiremote', () => {
        const monad = webdriverMonad({ isW3C: true }, (client) => client, prototype)
        const client = monad(sessionId)
        const instances = { foo: { __propertiesObject__: {} } }

        const func = function (x, y) { return x + y }

        client.addCommand('myCustomElementCommand', func, true, undefined, instances)
        expect(typeof instances.foo.__propertiesObject__.myCustomElementCommand).toBe('object')
        expect(instances.foo.__propertiesObject__.myCustomElementCommand.value).toBe(func)
    })

    it('allows to use custom command wrapper', () => {
        const monad = webdriverMonad({ isW3C: true }, (client) => client, prototype)
        const client = monad(sessionId, (commandName, commandFn) => {
            return (...args) => {
                return `${commandName}(${args.join(', ')}) = ${commandFn(...args)}`
            }
        })
        expect(client.someFunc(123)).toBe('someFunc(123) = result-123')
    })

    it('should allow empty prototype object', () => {
        const monad = webdriverMonad({ isW3C: true }, (client) => client)
        const client = monad(sessionId)
        expect(client.commandList).toHaveLength(0)
    })
})
