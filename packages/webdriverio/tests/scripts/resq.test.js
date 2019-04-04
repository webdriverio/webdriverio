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
    it('should call the window resq$', () => {
        react$('Test', { foo: 'bar' }, { test: 123 })

        const { resq$ } = global.window.resq
        const { byProps } = resq$.mock.results[0].value
        const { byState } = byProps.mock.results[0].value

        expect(resq$).toBeCalledTimes(1)
        expect(resq$).toBeCalledWith('Test')
        expect(byProps).toBeCalledTimes(1)
        expect(byProps).toBeCalledWith({ foo: 'bar' })
        expect(byState).toBeCalledTimes(1)
        expect(byState).toBeCalledWith({ test: 123 })
    })

    it('should call the window resq$$', () => {
        react$$('Test', { foo: 'bar' }, { test: 123 })

        const { resq$$ } = global.window.resq
        const { byProps } = resq$$.mock.results[0].value
        const { byState } = byProps.mock.results[0].value

        expect(resq$$).toBeCalledTimes(1)
        expect(resq$$).toBeCalledWith('Test')
        expect(byProps).toBeCalledTimes(1)
        expect(byProps).toBeCalledWith({ foo: 'bar' })
        expect(byState).toBeCalledTimes(1)
        expect(byState).toBeCalledWith({ test: 123 })
    })

    it('should call window waitToLoadReact', () => {
        waitToLoadReact()

        expect(global.window.resq.waitToLoadReact).toBeCalledTimes(1)
    })
})
