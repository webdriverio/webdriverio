import { wrapCommand } from '../src/shim'

jest.mock('@wdio/sync', () => {
    throw new Error('Does not exist')
})

describe('wrapCommand', () => {
    it('should not run a command hook in command hook', async () => {
        const rawCommand = jest.fn().mockReturnValue(Promise.resolve('Yayy!'))
        const commandA = wrapCommand('foobar', rawCommand)
        const commandB = wrapCommand('barfoo', rawCommand)
        const scope = {
            options: {
                beforeCommand: jest.fn(),
                afterCommand: jest.fn().mockImplementation(
                    () => commandB.call(scope, 123))
            }
        }

        expect(await commandA.call(scope, true, false, '!!')).toBe('Yayy!')
        expect(scope.options.beforeCommand).toBeCalledTimes(1)
        expect(scope.options.afterCommand).toBeCalledTimes(1)
        expect(rawCommand).toBeCalledTimes(2)
    })

    it('throws an error if command fails', async () => {
        const rawCommand = jest.fn().mockReturnValue(
            Promise.reject(new Error('Uppsi!')))
        const commandA = wrapCommand('foobar', rawCommand)
        const commandB = wrapCommand('barfoo', rawCommand)
        const scope = {
            options: {
                beforeCommand: jest.fn(),
                afterCommand: jest.fn().mockImplementation(
                    () => commandB.call(scope, 123))
            }
        }

        const error = await commandA.call(scope, true, false, '!!').catch((err) => err)
        expect(error.message).toBe('Uppsi!')
        expect(scope.options.beforeCommand).toBeCalledTimes(1)
        expect(scope.options.afterCommand).toBeCalledTimes(1)
        expect(rawCommand).toBeCalledTimes(2)
    })
})
