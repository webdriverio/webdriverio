import NetworkInterception from '../../../src/utils/interception'
import Timer from '../../../src/utils/Timer'

const browserMock = {
    call: jest.fn((cb) => cb()),
    options: {
        waitforTimeout: 123,
        waitforInterval: 321
    }
}

jest.mock('../../../src/utils/Timer',
    () => jest.fn().mockReturnValue(Promise.resolve()))

test('should use default interval and timeout if invalid', () => {
    // @ts-expect-error
    const mock = new NetworkInterception('**/foo', { method: 'post' }, browserMock)
    mock.waitForResponse()
    expect(Timer).toBeCalledWith(321, 123, expect.any(Function), true)

    ;(Timer as jest.Mock).mockClear()
    mock.waitForResponse({
        // @ts-ignore test invalid parameter
        timeout: 'foo',
        // @ts-ignore test invalid parameter
        interval: 'bar'
    })
    expect(Timer).toBeCalledWith(321, 123, expect.any(Function), true)

    ;(Timer as jest.Mock).mockClear()
    mock.waitForResponse({
        timeout: 111,
        interval: 444
    })
    expect(Timer).toBeCalledWith(444, 111, expect.any(Function), true)
})

test('allows custom error message', async () => {
    // @ts-expect-error
    const mock = new NetworkInterception('**/foo', { method: 'post' }, browserMock)
    ;(Timer as jest.Mock).mockReturnValue(Promise.reject(new Error('timeout')))
    let err = await mock.waitForResponse({
        timeoutMsg: 'uups'
    }).catch((err: Error) => err)
    expect(err.message).toBe('uups')

    ;(Timer as jest.Mock).mockClear()
    err = await mock.waitForResponse().catch((err: Error) => err)
    expect(err.message).toContain('waitForResponse timed out after')

    ;(Timer as jest.Mock).mockClear()
    ;(Timer as jest.Mock).mockReturnValue(Promise.reject(new Error('bug')))
    err = await mock.waitForResponse().catch((err: Error) => err)
    expect(err.message).toBe('waitForResponse failed with the following reason: bug')
})

test('isMatchingRequest', () => {
    expect(
        NetworkInterception.isMatchingRequest('**/foo.*.js', 'http://json.org/foo.bar.js')
    ).toBe(true)
    expect(
        NetworkInterception.isMatchingRequest('**/foo.*.js', 'http://json.org/foo.js')
    ).toBe(false)
    expect(
        NetworkInterception.isMatchingRequest(/foo\.(foo|bar)\.js/, 'http://json.org/foo.bar.js')
    ).toBe(true)
    expect(
        NetworkInterception.isMatchingRequest(/foo\.(foo|bar)\.js/, 'http://json.org/foo.loo.js')
    ).toBe(false)
    expect(
        // @ts-expect-error
        () => NetworkInterception.isMatchingRequest(false, 'http://json.org')
    ).toThrow()
})
