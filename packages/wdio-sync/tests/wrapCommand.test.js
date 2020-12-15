import { Future } from '../src/fibers'
import wrapCommand from '../src/wrapCommand'
import { anotherError } from './__mocks__/errors'

jest.mock('../src/executeHooksWithArgs', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => true)
}))

const futureWait = Future.wait
const futurePrototypeWait = Future.prototype.wait

describe('wrapCommand:runCommand', () => {
    beforeEach(() => {
        jest.resetAllMocks()
        delete global.WDIO_WORKER
    })

    it('should return result', async () => {
        process.emit('WDIO_TIMER', { id: 0, start: true })
        global.WDIO_WORKER = '1'
        const fn = jest.fn(x => (x + x))
        const runCommand = wrapCommand('foo', fn)
        const result = await runCommand.call({ config: {} }, 'bar')
        expect(result).toEqual('barbar')
        process.emit('WDIO_TIMER', { id: 0 })
    })

    it('should set _NOT_FIBER to false if elementId is missing', async () => {
        const fn = jest.fn()
        const runCommand = wrapCommand('foo', fn)
        const context = { config: {}, _NOT_FIBER: true }
        await runCommand.call(context, 'bar')
        expect(context._NOT_FIBER).toBe(false)
    })

    it('should set _NOT_FIBER to true if elementId is exist', async () => {
        const fn = jest.fn()
        const runCommand = wrapCommand('foo', fn)
        const context = { config: {}, _NOT_FIBER: true, elementId: 'foo' }
        await runCommand.call(context, 'bar')
        expect(context._NOT_FIBER).toBe(true)
    })

    it('should set _NOT_FIBER to false if elementId is exist but function is anonymous', async () => {
        const runCommand = wrapCommand('foo', () => { })
        const context = { config: {}, _NOT_FIBER: true, elementId: 'foo' }
        await runCommand.call(context, 'bar')
        expect(context._NOT_FIBER).toBe(false)
    })

    it('should set _NOT_FIBER to true if parent.elementId is exist', async () => {
        const fn = jest.fn()
        const runCommand = wrapCommand('foo', fn)
        const context = { config: {}, _NOT_FIBER: true, parent: { elementId: 'foo' } }
        await runCommand.call(context, 'bar')
        expect(context._NOT_FIBER).toBe(true)
    })

    it('should set _NOT_FIBER to false for element and every parent', async () => {
        Future.prototype.wait = () => {}
        const runCommand = wrapCommand('foo', jest.fn())

        const context = {
            config: {}, elementId: 'foo', parent: { _NOT_FIBER: true }
        }

        await runCommand.call(context)
        expect(context._NOT_FIBER).toEqual(false)
        expect(context.parent._NOT_FIBER).toEqual(false)
    })

    it('should set _NOT_FIBER to false function with empty name', async () => {
        Future.prototype.wait = () => {}
        const runCommand = wrapCommand('foo', () => {})

        const context = {
            config: {}, elementId: 'foo', _hidden_: null, _hidden_changes_: [],
            get _NOT_FIBER () { return this._hidden_ },
            set _NOT_FIBER (val) {
                this._hidden_changes_.push(val)
                this._hidden_ = val
            }
        }

        await runCommand.call(context)
        expect(context._hidden_changes_).toEqual([false, false])
    })

    it('should set _NOT_FIBER to multiremote instance', async () => {
        Future.prototype.wait = () => {}
        const runCommand = wrapCommand('waitUntil', jest.fn())

        const context = {
            _hidden_changes_: [],
            constructor: { name: 'MultiRemoteDriver' },
            instances: ['browserA', 'browserB'],
            browserA: {
                _hidden_: true,
                get _NOT_FIBER () { return context.browserA._hidden_ },
                set _NOT_FIBER (val) {
                    context._hidden_changes_.push(`browserA ${val}`)
                    context._hidden_ = val
                },
                parent: {
                    _hidden_: true,
                    get _NOT_FIBER () { return context.browserA.parent._hidden_ },
                    set _NOT_FIBER (val) {
                        context._hidden_changes_.push(`parent ${val}`)
                        context._hidden_ = val
                    }
                }
            },
            browserB: {
                _hidden_: true,
                get _NOT_FIBER () { return context.browserB._hidden_ },
                set _NOT_FIBER (val) {
                    context._hidden_changes_.push(`browserB ${val}`)
                    context._hidden_ = val
                }
            }
        }

        await runCommand.call(context)
        expect(context._hidden_changes_).toEqual(['browserA false', 'parent false', 'browserB false'])
    })

    it('should throw error with proper message', async () => {
        const fn = jest.fn(x => { throw new Error(x) })
        const runCommand = wrapCommand('foo', fn)
        const result = runCommand.call({ config: {} }, 'bar')
        await expect(result).rejects.toEqual(new Error('bar'))
    })

    it('should contain merged error stack', async () => {
        const fn = jest.fn(() => { throw anotherError })
        const runCommand = wrapCommand('foo', fn)
        const result = runCommand.call({ config: {} }, 'bar')
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
        const result = runCommand.call({ config: {} }, 'bar')
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
        const result = runCommand.call({ config: {} })
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
        })

        it('should throw regular error', () => {
            const fn = jest.fn(() => {})
            const runCommand = wrapCommand('foo', fn)
            const context = { config: {} }
            try {
                runCommand.call(context, 'bar')
            } catch (err) {
                expect(Future.wait).toThrow()
            }
            expect(context._NOT_FIBER).toBe(false)
            expect.assertions(2)
        })
    })

    /**
     * actual testing is done with smoke tests
     * only branch coverage here
     */
    describe('WDIO_TIMER', () => {
        it('WDIO_TIMER listener', () => {
            process.emit('WDIO_TIMER', { id: 1, start: true })
            process.emit('WDIO_TIMER', { id: 1 })
            process.emit('WDIO_TIMER', { id: 2, start: true })

            process.emit('WDIO_TIMER', { id: 2, start: true })
            process.emit('WDIO_TIMER', { id: 3, start: true })
            process.emit('WDIO_TIMER', { id: 2, timeout: true })
            process.emit('WDIO_TIMER', { id: 123, timeout: true })
        })
    })

    afterEach(() => {
        Future.wait = futureWait
        Future.prototype.wait = futurePrototypeWait
    })
})
