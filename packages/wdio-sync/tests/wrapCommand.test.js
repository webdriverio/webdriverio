import Future from 'fibers/future'
import wrapCommand from '../src/wrapCommand'
import { anotherError } from './__mocks__/errors'

jest.mock('../src/executeHooksWithArgs', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => true)
}))

const futureReturn = Future.return
const futureWait = Future.wait

describe('wrapCommand:runCommand', () => {

    beforeEach(() => {
        jest.resetAllMocks()
    })

    it('should return result', async () => {
        const fn = jest.fn(x => (x + x))
        const runCommand = wrapCommand('foo', fn)
        const result = await runCommand.call({ options: {} }, 'bar')
        expect(result).toEqual('barbar')
    })

    it('should throw error with proper message', async () => {
        const fn = jest.fn(x => { throw new Error(x) })
        const runCommand = wrapCommand('foo', fn)
        const result = runCommand.call({ options: {} }, 'bar')
        await expect(result).rejects.toEqual(new Error('bar'))
    })

    it('should contain merged error stack', async () => {
        const fn = jest.fn(() => { throw anotherError })
        const runCommand = wrapCommand('foo', fn)
        const result = runCommand.call({ options: {} }, 'bar')
        try {
            await result
        } catch (err) {
            expect(err).toEqual(new Error('AnotherError'))
            expect(err.name).toBe('Error')
            expect(err.stack.split('wrapCommand.test.js')).toHaveLength(3)
            expect(err.stack).toContain('__mocks__')
        }
        expect.assertions(4)
    })

    it('should accept non Error objects', async () => {
        const fn = jest.fn(x => Promise.reject(x))
        const runCommand = wrapCommand('foo', fn)
        const result = runCommand.call({ options: {} }, 'bar')
        try {
            await result
        } catch (err) {
            expect(err).toEqual(new Error('bar'))
            expect(err.name).toBe('Error')
            expect(err.stack.split('wrapCommand.test.js')).toHaveLength(2)
        }
        expect.assertions(3)
    })

    it('should accept undefined', async () => {
        const fn = jest.fn(() => Promise.reject())
        const runCommand = wrapCommand('foo', fn)
        const result = runCommand.call({ options: {} })
        try {
            await result
        } catch (err) {
            expect(err).toEqual(new Error())
            expect(err.name).toBe('Error')
            expect(err.stack.split('wrapCommand.test.js')).toHaveLength(2)
        }
        expect.assertions(3)
    })

    describe('future', () => {
        beforeEach(() => {
            Future.wait = jest.fn(() => { throw new Error() })
            Future.return = jest.fn(() => { })
        })

        it('should throw regular error', () => {
            const fn = jest.fn(() => {})
            const runCommand = wrapCommand('foo', fn)
            try {
                runCommand.call({ options: {} }, 'bar')
            } catch (err) {
                expect(Future.wait).toThrow()
            }
            expect.assertions(1)
        })

        afterEach(() => {
            Future.wait = futureWait
            Future.return = futureReturn
        })
    })
})
