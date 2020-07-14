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
    const mock = new NetworkInterception('**/foo', { method: 'post' }, browserMock)
    mock.waitForResponse()
    expect(Timer).toBeCalledWith(321, 123, expect.any(Function), true)

    Timer.mockClear()
    mock.waitForResponse({
        timeout: 'foo',
        interval: 'bar'
    })
    expect(Timer).toBeCalledWith(321, 123, expect.any(Function), true)

    Timer.mockClear()
    mock.waitForResponse({
        timeout: 111,
        interval: 444
    })
    expect(Timer).toBeCalledWith(444, 111, expect.any(Function), true)
})

test('allows custom error message', async () => {
    const mock = new NetworkInterception('**/foo', { method: 'post' }, browserMock)
    Timer.mockReturnValue(Promise.reject(new Error('timeout')))
    let err = await mock.waitForResponse({
        timeoutMsg: 'uups'
    }).catch((err) => err)
    expect(err.message).toBe('uups')

    Timer.mockClear()
    err = await mock.waitForResponse().catch((err) => err)
    expect(err.message).toContain('waitForResponse timed out after')

    Timer.mockClear()
    Timer.mockReturnValue(Promise.reject(new Error('bug')))
    err = await mock.waitForResponse().catch((err) => err)
    expect(err.message).toBe('waitForResponse failed with the following reason: bug')
})
