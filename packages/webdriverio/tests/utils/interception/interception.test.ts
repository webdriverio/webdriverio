import { test, expect, vi } from 'vitest'
import NetworkInterception from '../../../src/utils/interception/index.js'
import Timer from '../../../src/utils/Timer.js'

const browserMock = {
    call: vi.fn((cb) => cb()),
    options: {
        waitforTimeout: 123,
        waitforInterval: 321
    }
}

vi.mock('../../../src/utils/Timer', () => ({
    default: vi.fn().mockReturnValue(Promise.resolve())
}))

test('should use default interval and timeout if invalid', () => {
    // @ts-expect-error
    const mock = new NetworkInterception('**/foo', { method: 'post' }, browserMock)
    mock.waitForResponse()
    expect(Timer).toBeCalledWith(321, 123, expect.any(Function), true)

    vi.mocked(Timer).mockClear()
    mock.waitForResponse({
        // @ts-ignore test invalid parameter
        timeout: 'foo',
        // @ts-ignore test invalid parameter
        interval: 'bar'
    })
    expect(Timer).toBeCalledWith(321, 123, expect.any(Function), true)

    vi.mocked(Timer).mockClear()
    mock.waitForResponse({
        timeout: 111,
        interval: 444
    })
    expect(Timer).toBeCalledWith(444, 111, expect.any(Function), true)
})

test('allows custom error message', async () => {
    // @ts-expect-error
    const mock = new NetworkInterception('**/foo', { method: 'post' }, browserMock)
    vi.mocked(Timer).mockRejectedValue(new Error('timeout'))
    let err = await mock.waitForResponse({
        timeoutMsg: 'uups'
    }).catch((err: Error) => err)
    expect(err.message).toBe('uups')

    vi.mocked(Timer).mockClear()
    err = await mock.waitForResponse().catch((err: Error) => err)
    expect(err.message).toContain('waitForResponse timed out after')

    vi.mocked(Timer).mockClear()
    vi.mocked(Timer).mockRejectedValue(new Error('bug'))
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
