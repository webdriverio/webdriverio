import webdriverMonad from '../src/monad'

const prototype = {
    someFunc: { value: jest.fn().mockImplementation((arg) => `result-${arg.toString()}`) }
}
const sessionId = 'c5fa4320-07d5-48f5-b7c2-922d4405e17f'

describe('monad', () => {
    it('should be able to initialize client with prototype with commands', () => {
        const modifier = jest.fn()
        const monad = webdriverMonad({ isW3C: true }, (client) => {
            modifier()
            return client
        }, prototype)
        const client = monad(sessionId)

        expect(client.sessionId).toBe(sessionId)
        expect(client.isW3C).toBe(true)
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
        expect(commandWrapperMock).toBeCalledWith('foo', fn)
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
