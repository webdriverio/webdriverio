function res(status: number, value: any, fullValue: boolean = false) {
    return { status, json: () => fullValue ? value : { value } }
}

function err(status: number, name: string, message: string) {
    return { status, json: () => ({ value: { error: name, message } }) }
}

const kyMock: any = jest.fn().mockImplementation((url, opts) => {
    switch (url.pathname) {
    case '/sumoerror':
        throw new Error('ups')
    case '/session/foobar-123/element':
        return res(200, { 'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123' })
    case '/session/foobar-123/element/some-sub-sub-elem-231/click':
        return err(404, 'stale element reference', 'element is not attached to the page document')
    case '/empty':
        return res(500, '', true)
    case '/failing':
        ++kyMock.retryCnt
        if (kyMock.retryCnt > 3) {
            return res(200, 'caught')
        }
        return res(400, {}, true)
    case '/grid/api/hub':
        return res(200, { some: 'config' }, true)
    case '/grid/api/testsession':
        return res(200, '<!DOCTYPE html><html lang="en"></html>', true)
    case '/connectionRefused':
        if (kyMock.retryCnt < 5) {
            ++kyMock.retryCnt
            return res(200, {
                stacktrace: 'java.lang.RuntimeException: java.net.ConnectException: Connection refused',
                stackTrace: [],
                message: 'java.net.ConnectException: Connection refused: connect',
                error: 'unknown error'
            })
        }
        return res(200, { foo: 'bar' })
    }

    if (url.pathname.endsWith('timeout')) {
        if (kyMock.retryCnt < 5) {
            const timeoutError: any = new Error('Timeout')
            timeoutError.name = 'TimeoutError'
            timeoutError.code = 'ETIMEDOUT'
            timeoutError.event = 'request'
            ++kyMock.retryCnt

            throw timeoutError
        }
        return res(200, {})
    }
    return res(200, opts)
})

kyMock.retryCnt = 0

export default kyMock
