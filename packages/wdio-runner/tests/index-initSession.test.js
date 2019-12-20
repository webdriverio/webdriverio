import WDIORunner from '../src'

jest.mock('../src/utils', () => ({
    __esModule: true,
    initialiseInstance(err) {
        if (err) {
            throw new Error(err)
        }
        return {
            '$'() { },
            '$$'() { },
            sessionId: 'id',
            isBar: false,
            events: {},
            on(eventName, callback) {
                this.events[eventName] = callback
            }
        }
    }
}))

describe('wdio-runner', () => {
    describe('_initSession', () => {
        let runner

        beforeEach(() => {
            runner = new WDIORunner()
            runner.reporter = {
                emit: jest.fn()
            }
        })

        it('command event', async () => {
            const browser = await runner._initSession()

            const command = { foo: 'bar' }
            browser.events.command(command)

            expect(command).toEqual({ foo: 'bar', sessionId: 'id' })
        })

        it('result event', async () => {
            const browser = await runner._initSession()

            const result = { bar: 'foo' }
            browser.events.result(result)

            expect(result).toEqual({ bar: 'foo', sessionId: 'id' })
        })

        it('should add user flags to browser but not overwrite', async () => {
            const browser = await runner._initSession(undefined, undefined, { isFoo: true, $: true, $$: false, isBar: true })

            expect(typeof browser.$).toBe('function')
            expect(typeof browser.$$).toBe('function')
            expect(browser.isFoo).toBe(true)
            expect(browser.isBar).toBe(false)
        })

        it('throw error', () => {
            expect(runner._initSession('err')).rejects.toThrow('err')
        })
    })
})
