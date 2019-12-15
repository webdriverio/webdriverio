import waitForPromise from '../src'

test('should return result if not a promise', () => {
    expect(waitForPromise('foobar')).toBe('foobar')
})
