import deasync from 'deasync'

import waitForPromise from '../src'

jest.mock('deasync', () => ({
    loopWhile: jest.fn().mockImplementation((fn) => fn())
}))

beforeEach(() => {
    deasync.loopWhile.mockClear()
})

test('should return result if not a promise', () => {
    expect(waitForPromise('foobar')).toBe('foobar')
    expect(deasync.loopWhile).toHaveBeenCalledTimes(0)
})

test('should return the result of the promise', () => {
    const promise = Promise.resolve('foobar')
    promise.then = (resolve) => resolve('foobar')
    const result = waitForPromise(promise)
    expect(result).toBe('foobar')
    expect(deasync.loopWhile).toHaveBeenCalledTimes(1)
})

test('should throw if promise rejects', () => {
    expect.assertions(1)

    const promise = Promise.resolve('foobar')
    promise.then = (_, reject) => reject(new Error('uups'))

    try {
        waitForPromise(promise)
    } catch (err) {
        expect(err.message).toBe('uups')
    }
})

test('should throw if promise rejects a string', () => {
    expect.assertions(1)

    const promise = Promise.resolve('foobar')
    promise.then = (_, reject) => reject('uups')

    try {
        waitForPromise(promise)
    } catch (err) {
        expect(err.message).toBe('uups')
    }
})
