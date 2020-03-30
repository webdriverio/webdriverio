/**
 * @jest-environment jsdom
 */

import { react$, react$$, waitToLoadReact } from '../../src/scripts/resq'

class MockResq {
    constructor() {
        this.byProps = jest.fn().mockImplementation(() => new MockResq())
        this.byState = jest.fn().mockImplementation(() => new MockResq())
    }
}

beforeEach(() => {
    global.window.resq = {
        resq$: jest.fn().mockImplementation(() => new MockResq()),
        resq$$: jest.fn().mockImplementation(() => new MockResq()),
        waitToLoadReact: jest.fn(),
    }
})

describe('resq script', () => {
    describe('react$', () => {
        it('should call the window function', () => {
            const result = react$('Test', { foo: 'bar' }, { test: 123 })

            const { resq$ } = global.window.resq
            const { byProps } = resq$.mock.results[0].value
            const { byState } = byProps.mock.results[0].value

            expect(resq$).toBeCalledTimes(1)
            expect(resq$).toBeCalledWith('Test', undefined)
            expect(byProps).toBeCalledTimes(1)
            expect(byProps).toBeCalledWith({ foo: 'bar' })
            expect(byState).toBeCalledTimes(1)
            expect(byState).toBeCalledWith({ test: 123 })
            expect(result).toMatchObject({ message: 'React element with selector "Test" wasn\'t found' })
        })

        it('should return node object found', () => {
            global.window.resq.resq$ = jest.fn().mockImplementation(() => ([{
                node: global.document.createElement('div')
            }]))

            const result = react$('Test', {}, {})

            expect(result).toMatchObject(global.document.createElement('div'))
        })

        it('should return the first node object for fragments', () => {
            global.window.resq.resq$ = jest.fn().mockImplementation(() => ([{
                node: [global.document.createElement('div'), global.document.createElement('div')],
                isFragment: true,
            }]))

            const result = react$('Test', {}, {})

            expect(result).toMatchObject(global.document.createElement('div'))
        })
    })

    describe('react$$"', () => {
        it('should call the window functiom', () => {
            const result = react$$('Test', { foo: 'bar' }, { test: 123 })

            const { resq$$ } = global.window.resq
            const { byProps } = resq$$.mock.results[0].value
            const { byState } = byProps.mock.results[0].value

            expect(resq$$).toBeCalledTimes(1)
            expect(resq$$).toBeCalledWith('Test', undefined)
            expect(byProps).toBeCalledTimes(1)
            expect(byProps).toBeCalledWith({ foo: 'bar' })
            expect(byState).toBeCalledTimes(1)
            expect(byState).toBeCalledWith({ test: 123 })
            expect(result).toMatchObject([])
        })

        it('should return node objects found', () => {
            global.window.resq.resq$$ = jest.fn().mockImplementation(() => ([
                { node: global.document.createElement('div') }
            ]))

            const result = react$$('Test', {}, {})

            expect(result).toMatchObject([global.document.createElement('div')])
        })

        it('should return array node objects for fragments', () => {
            global.window.resq.resq$$ = jest.fn().mockImplementation(() => ([
                {
                    node: [global.document.createElement('div'), global.document.createElement('div')],
                    isFragment: true,
                },
                {
                    node: [global.document.createElement('div'), global.document.createElement('div')],
                    isFragment: true,
                }
            ]))

            const result = react$$('Test', {}, {})

            expect(result).toMatchObject([
                global.document.createElement('div'),
                global.document.createElement('div'),
                global.document.createElement('div'),
                global.document.createElement('div')
            ])
        })
    })

    it('should call window waitToLoadReact', () => {
        waitToLoadReact()

        expect(global.window.resq.waitToLoadReact).toBeCalledTimes(1)
    })
})

afterEach(() => {
    delete global.window.resq
})
