import { vi } from 'vitest'

export const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'

let manualMockResponse: any

const path = '/session'

const customResponses = new Set<{ pattern, response }>()
const defaultSessionId = 'foobar-123'
let sessionId = defaultSessionId
const genericElementId = 'some-elem-123'
const genericSubElementId = 'some-sub-elem-321'
const genericSubSubElementId = 'some-sub-sub-elem-231'
const requestMock: any = vi.fn().mockImplementation((uri, params) => {
    let value: any = {}
    let jsonwpMode = false
    let sessionResponse: any = {
        sessionId,
        capabilities: {
            browserName: 'mockBrowser',
            platformName: 'node',
            browserVersion: '1234',
            setWindowRect: true
        }
    }

    if (typeof uri === 'string') {
        uri = new URL(uri)
    }

    for (const { pattern, response } of customResponses) {
        if (!(uri as URL).pathname.match(pattern)) {
            continue
        }
        return response
    }

    if (
        params.json &&
        params.json.capabilities &&
        params.json.capabilities.alwaysMatch.jsonwpMode
    ) {
        jsonwpMode = true
        sessionResponse = {
            sessionId,
            browserName: 'mockBrowser'
        }
    }

    if (
        params.json &&
        params.json.capabilities &&
        params.json.capabilities.alwaysMatch.mobileMode
    ) {
        sessionResponse.capabilities.deviceName = 'iNode'
    }

    if (
        params.json &&
        params.json.capabilities &&
        params.json.capabilities.alwaysMatch.keepBrowserName
    ) {
        sessionResponse.capabilities.browserName = params.json.capabilities.alwaysMatch.browserName
    }

    if (
        params.json &&
        params.json.desiredCapabilities &&
        params.json.desiredCapabilities['sauce:options']
    ) {
        sessionResponse.capabilities['sauce:options'] = params.json.desiredCapabilities['sauce:options']
    }

    switch (uri.pathname) {
    case path:
        value = sessionResponse

        if (params.json.capabilities.alwaysMatch.browserName && params.json.capabilities.alwaysMatch.browserName.includes('noW3C')) {
            value.desiredCapabilities = { browserName: 'mockBrowser' }
            delete value.capabilities
        }

        if (params.json.capabilities.alwaysMatch.browserName && params.json.capabilities.alwaysMatch.browserName.includes('devtools')) {
            value.capabilities['goog:chromeOptions'] = {
                debuggerAddress: 'localhost:1234'
            }
        }

        break
    case `/session/${sessionId}/element`:
        if (params.json && params.json.value === '#nonexisting') {
            value = { elementId: null }
            break
        }

        if (params.json && params.json.value === 'html') {
            value = { [ELEMENT_KEY]: 'html-element' }
            break
        }

        if (params.json && params.json.value === '#slowRerender') {
            ++requestMock.retryCnt
            if (requestMock.retryCnt === 2) {
                ++requestMock.retryCnt
                value = { elementId: null }
                break
            }
        }
        value = {
            [ELEMENT_KEY]: genericElementId
        }

        break
    case `${path}/${sessionId}/element/some-elem-123/element`:
        value = {
            [ELEMENT_KEY]: genericSubElementId
        }
        break
    case `${path}/${sessionId}/element/${genericSubElementId}/element`:
        value = {
            [ELEMENT_KEY]: genericSubSubElementId
        }
        break
    case `${path}/${sessionId}/element/html-element/rect`:
        value = {
            x: 0,
            y: 0,
            height: 1000,
            width: 1000
        }
        break
    case `${path}/${sessionId}/element/${genericElementId}/rect`:
        value = {
            x: 15,
            y: 20,
            height: 30,
            width: 50
        }
        break
    case `${path}/${sessionId}/element/${genericSubElementId}/rect`:
        value = {
            x: 100,
            y: 200,
            height: 120,
            width: 150
        }
        break
    case `${path}/${sessionId}/element/${genericElementId}/size`:
        value = {
            height: 30,
            width: 50
        }
        break
    case `${path}/${sessionId}/element/${genericElementId}/location`:
        value = {
            x: 15,
            y: 20
        }
        break
    case `${path}/${sessionId}/element/${genericElementId}/displayed`:
        value = true
        break
    case `${path}/${sessionId}/elements`:
        value = [
            { [ELEMENT_KEY]: genericElementId },
            { [ELEMENT_KEY]: 'some-elem-456' },
            { [ELEMENT_KEY]: 'some-elem-789' },
        ]
        break
    case `${path}/${sessionId}/element/${genericElementId}/css/width`:
        value = '1250px'
        break
    case `${path}/${sessionId}/element/${genericElementId}/css/margin-top`:
    case `${path}/${sessionId}/element/${genericElementId}/css/margin-right`:
    case `${path}/${sessionId}/element/${genericElementId}/css/margin-bottom`:
    case `${path}/${sessionId}/element/${genericElementId}/css/margin-left`:
        value = '42px'
        break
    case `${path}/${sessionId}/element/${genericElementId}/css/padding-top`:
    case `${path}/${sessionId}/element/${genericElementId}/css/padding-bottom`:
        value = '4px'
        break
    case `${path}/${sessionId}/element/${genericElementId}/css/padding-right`:
    case `${path}/${sessionId}/element/${genericElementId}/css/padding-left`:
        value = '2px'
        break
    case `${path}/${sessionId}/element/${genericElementId}/property/tagName`:
        value = 'BODY'
        break
    case `/session/${sessionId}/execute`:
    case `/session/${sessionId}/execute/sync`: {
        const script = Function(params.json.script)
        const args = params.json.args.map((arg: any) => (arg && (arg.ELEMENT || arg[ELEMENT_KEY])) || arg)

        let result: any = null
        if (params.json.script.includes('resq')) {
            if (params.json.script.includes('react$$')) {
                result = [
                    { [ELEMENT_KEY]: genericElementId },
                    { [ELEMENT_KEY]: 'some-elem-456' },
                    { [ELEMENT_KEY]: 'some-elem-789' },
                ]
            } else if (params.json.script.includes('react$')) {
                result = args[0] === 'myNonExistingComp'
                    ? new Error('foobar')
                    : { [ELEMENT_KEY]: genericElementId }
            } else {
                result = null
            }
        } else if (params.json.script.includes('testLocatorStrategy')) {
            result = { [ELEMENT_KEY]: genericElementId }
        } else if (params.json.script.includes('testLocatorStrategiesMultiple')) {
            result = [
                { [ELEMENT_KEY]: genericElementId },
                { [ELEMENT_KEY]: 'some-elem-456' },
                { [ELEMENT_KEY]: 'some-elem-789' },
            ]
        } else if (params.json.script.includes('previousElementSibling')) {
            result = params.json.args[0][ELEMENT_KEY] === genericSubElementId
                ? { [ELEMENT_KEY]: 'some-previous-elem' }
                : {}
        } else if (params.json.script.includes('parentElement')) {
            result = params.json.args[0][ELEMENT_KEY] === genericSubElementId
                ? { [ELEMENT_KEY]: 'some-parent-elem' }
                : {}
        } else if (params.json.script.includes('nextElementSibling')) {
            result = params.json.args[0][ELEMENT_KEY] === 'some-elem-123'
                ? { [ELEMENT_KEY]: 'some-next-elem' }
                : {}
        } else if (params.json.script.includes('function isFocused')) {
            result = true
        } else {
            result = script.apply(this, args)
        }

        //false and 0 are valid results
        value = Boolean(result) || result === false || result === 0 || result === null ? result : {}
        break
    } case `/session/${sessionId}/execute/async`: {
        const script = Function(params.json.script)
        let result
        script.call(this, ...params.json.args, (_result: any) => result = _result)
        value = result ?? {}
        break
    } case `${path}/${sessionId}/element/${genericElementId}/elements`:
        value = [
            { [ELEMENT_KEY]: genericSubElementId, index: 0 },
            { [ELEMENT_KEY]: 'some-elem-456', index: 1 },
            { [ELEMENT_KEY]: 'some-elem-789', index: 2 },
        ]
        break
    case `${path}/${sessionId}/cookie`:
        value = [
            { name: 'cookie1', value: 'dummy-value-1' },
            { name: 'cookie2', value: 'dummy-value-2' },
            { name: 'cookie3', value: 'dummy-value-3' },
        ]
        break
    case `${path}/${sessionId}/window/handles`:
        value = ['window-handle-1', 'window-handle-2', 'window-handle-3']
        break
    case `${path}/${sessionId}/window`:
        value = 'window-handle-1'
        break
    case `${path}/${sessionId}/url`:
        value = 'https://webdriver.io/?foo=bar'
        break
    case `${path}/${sessionId}/title`:
        value = 'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO'
        break
    case `${path}/${sessionId}/screenshot`:
    case `${path}/${sessionId}/appium/stop_recording_screen`:
        value = Buffer.from('some screenshot').toString('base64')
        break
    case `${path}/${sessionId}/print`:
        value = Buffer.from('some pdf print').toString('base64')
        break
    case `${path}/${sessionId}/element/${genericElementId}/screenshot`:
        value = Buffer.from('some element screenshot').toString('base64')
        break
    case '/grid/api/hub':
        value = { some: 'config' }
        break
    case '/grid/api/testsession':
        value = '<!DOCTYPE html><html lang="en"></html>'
        break
    case '/connectionRefused':
        if (requestMock.retryCnt < 5) {
            ++requestMock.retryCnt
            value = {
                stacktrace: 'java.lang.RuntimeException: java.net.ConnectException: Connection refused',
                stackTrace: [],
                message: 'java.net.ConnectException: Connection refused: connect',
                error: 'unknown error'
            }
        } else {
            value = { foo: 'bar' }
        }
    }

    if (uri.pathname.endsWith('timeout') && requestMock.retryCnt < 5) {
        const timeoutError: any = new Error('Timeout')
        timeoutError.name = 'TimeoutError'
        timeoutError.code = 'ETIMEDOUT'
        timeoutError.event = 'request'
        ++requestMock.retryCnt

        return Promise.reject(timeoutError)
    }

    if (uri.pathname.startsWith(`/session/${sessionId}/element/`) && uri.pathname.includes('/attribute/')) {
        value = `${uri.pathname.substring(uri.pathname.lastIndexOf('/') + 1)}-value`
    }

    if (uri.pathname.endsWith('sumoerror')) {
        return Promise.reject(new Error('ups'))
    }

    /**
     * Simulate a stale element
     */
    if (uri.pathname === `/session/${sessionId}/element/${genericSubSubElementId}/click`) {
        ++requestMock.retryCnt

        if (requestMock.retryCnt > 1) {
            const response = { value: null }
            return Promise.resolve({
                headers: { foo: 'bar' },
                statusCode: 200,
                body: response
            })
        }

        // https://www.w3.org/TR/webdriver1/#handling-errors
        let error = {
            value: {
                'error': 'stale element reference',
                'message': 'element is not attached to the page document'
            }
        }

        return Promise.resolve({
            headers: { foo: 'bar' },
            statusCode: 404,
            body: error
        })
    }

    /**
     * empty response
     */
    if (uri.pathname === '/empty') {
        return Promise.resolve({
            headers: { foo: 'bar' },
            statusCode: 500,
            body: ''
        })
    }

    /**
     * session error due to wrong path
     */
    if (uri.pathname === '/wrong/path') {
        return Promise.resolve({
            headers: { foo: 'bar' },
            statusCode: 404
        })
    }

    /**
     * simulate failing response
     */
    if (uri.pathname === '/failing') {
        ++requestMock.retryCnt

        /**
         * success this request if you retry 3 times
         */
        if (requestMock.retryCnt > 3) {
            const response = { value: 'caught' }
            return Promise.resolve({
                headers: { foo: 'bar' },
                statusCode: 200,
                body: response
            })
        }

        return Promise.resolve({
            headers: { foo: 'bar' },
            statusCode: 400,
            body: {}
        })
    }

    /**
     * overwrite if manual response is set
     */
    let statusCode = 200
    if (Array.isArray(manualMockResponse)) {
        value = manualMockResponse.shift() || value

        if (typeof value.statusCode === 'number') {
            statusCode = value.statusCode
        }

        if (manualMockResponse.length === 0) {
            manualMockResponse = null
        }
    } else if (manualMockResponse) {
        value = manualMockResponse
        manualMockResponse = null
    }

    let response: any = { value }
    if (jsonwpMode) {
        response = { value, sessionId, status: 0 }
    }

    if (uri.pathname.startsWith('/grid')) {
        response = response.value
    }

    return Promise.resolve({
        headers: { foo: 'bar' },
        statusCode,
        body: response
    })
})

requestMock.extend = vi.fn().mockReturnValue(requestMock)
requestMock.put = vi.fn().mockReturnValue(Promise.resolve({}))
requestMock.retryCnt = 0
requestMock.setMockResponse = (value: any) => {
    manualMockResponse = value
}
requestMock.customResponseFor = (pattern: RegExp, response: any) => {
    customResponses.add({ pattern, response })
}

requestMock.getSessionId = () => sessionId
requestMock.setSessionId = (newSessionId: any) => {
    sessionId = newSessionId
}
requestMock.resetSessionId = () => {
    sessionId = defaultSessionId
}

export default requestMock
