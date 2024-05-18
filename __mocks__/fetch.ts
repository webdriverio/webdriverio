import { vi } from 'vitest'

const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'
const SHADOW_ELEMENT_KEY = 'shadow-6066-11e4-a52e-4f735466cecf'

let manualMockResponse: any

const path = '/session'

const customResponses = new Set<{ pattern, response }>()
const defaultSessionId = 'foobar-123'
let sessionId = defaultSessionId
const genericElementId = 'some-elem-123'
const genericSubElementId = 'some-sub-elem-321'
const genericSubSubElementId = 'some-sub-sub-elem-231'
const genericShadowElementId = 'some-shadow-elem-123'
const genericSubShadowElementId = 'some-shadow-sub-elem-321'

/**
 * Transform the specified property of each object in the collection by replacing 'mockFunction' with a predefined function (vi.fn()).
 * This is intended to ensure that, when converting the request body to a string, functions are retained and not omitted.
 * @param collection - An array of objects to process.
 * @returns A new array with updated objects.
 */
const transformPropertyWithMockFunction = (collection: any[]) => {
    return collection.map(item => {
        for (const prop in item) {
            if (item[prop] && item[prop] === 'mockFunction') {
                item[prop] = vi.fn()
            }
        }
        return item
    })
}

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
        return Response.json(response)
    }

    let body: any = params?.body

    try {
        body = body && JSON.parse(body.toString())
    } catch {
        return Response.json({}, {
            status: 422,
            statusText: 'Unprocessable Entity'
        })
    }

    if (
        body &&
        body.capabilities &&
        body.capabilities.alwaysMatch.jsonwpMode
    ) {
        jsonwpMode = true
        sessionResponse = {
            sessionId,
            browserName: 'mockBrowser'
        }
    }

    if (
        body &&
        body.capabilities &&
        body.capabilities.alwaysMatch.mobileMode
    ) {
        sessionResponse.capabilities.deviceName = 'iNode'
    }

    if (
        body &&
        body.capabilities &&
        body.capabilities.alwaysMatch.keepBrowserName
    ) {
        sessionResponse.capabilities.browserName = body.capabilities.alwaysMatch.browserName
    }

    if (
        body &&
        body.desiredCapabilities &&
        body.desiredCapabilities['sauce:options']
    ) {
        sessionResponse.capabilities['sauce:options'] = body.desiredCapabilities['sauce:options']
    }

    if (body?.capabilities?.alwaysMatch?.browserName === 'bidi') {
        sessionResponse.capabilities.webSocketUrl = 'ws://webdriver.io'
    }

    switch (uri.pathname) {
    case path:
        value = sessionResponse

        if (body.capabilities.alwaysMatch.browserName && body.capabilities.alwaysMatch.browserName.includes('noW3C')) {
            value.desiredCapabilities = { browserName: 'mockBrowser' }
            delete value.capabilities
        }

        if (body.capabilities.alwaysMatch.browserName && body.capabilities.alwaysMatch.browserName.includes('devtools')) {
            value.capabilities['goog:chromeOptions'] = {
                debuggerAddress: 'localhost:1234'
            }
        }

        if (body.capabilities.alwaysMatch.platformName && body.capabilities.alwaysMatch.platformName.includes('iOS')) {
            value.capabilities.platformName = 'iOS'
        }

        break
    case `/session/${sessionId}/element`:
        if (body && body.value === '#nonexisting') {
            value = { elementId: null }
            break
        }

        if (body && body.value === 'html') {
            value = { [ELEMENT_KEY]: 'html-element' }
            break
        }

        if (body && body.value === '#slowRerender') {
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
    case `${path}/${sessionId}/element/${genericElementId}/element`:
        value = {
            [ELEMENT_KEY]: genericSubElementId
        }
        break
    case `${path}/${sessionId}/shadow/${genericShadowElementId}/element`:
        value = {
            [ELEMENT_KEY]: genericSubShadowElementId
        }
        break
    case `${path}/${sessionId}/element/${genericElementId}/shadow`:
        value = {
            [SHADOW_ELEMENT_KEY]: genericShadowElementId
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
        const script = Function(body.script)
        const args = transformPropertyWithMockFunction(body.args.map((arg: any) => (arg && (arg.ELEMENT || arg[ELEMENT_KEY])) || arg))

        let result: any = null
        if (body.script.includes('resq')) {
            if (body.script.includes('react$$')) {
                result = [
                    { [ELEMENT_KEY]: genericElementId },
                    { [ELEMENT_KEY]: 'some-elem-456' },
                    { [ELEMENT_KEY]: 'some-elem-789' },
                ]
            } else if (body.script.includes('react$')) {
                result = args[0] === 'myNonExistingComp'
                    ? new Error('foobar')
                    : { [ELEMENT_KEY]: genericElementId }
            } else {
                result = null
            }
        } else if (body.script.includes('testLocatorStrategy')) {
            result = { [ELEMENT_KEY]: genericElementId }
        } else if (body.script.includes('testLocatorStrategiesMultiple')) {
            result = [
                { [ELEMENT_KEY]: genericElementId },
                { [ELEMENT_KEY]: 'some-elem-456' },
                { [ELEMENT_KEY]: 'some-elem-789' },
            ]
        } else if (body.script.includes('previousElementSibling')) {
            result = body.args[0][ELEMENT_KEY] === genericSubElementId
                ? { [ELEMENT_KEY]: 'some-previous-elem' }
                : {}
        } else if (body.script.includes('parentElement')) {
            result = body.args[0][ELEMENT_KEY] === genericSubElementId
                ? { [ELEMENT_KEY]: 'some-parent-elem' }
                : {}
        } else if (body.script.includes('nextElementSibling')) {
            result = body.args[0][ELEMENT_KEY] === genericElementId
                ? { [ELEMENT_KEY]: 'some-next-elem' }
                : {}
        } else if (body.script.includes('scrollX')) {
            result = [0, 0]
        } else if (body.script.includes('function isFocused')) {
            result = true
        } else {
            result = script.apply(this, args)
        }

        //false and 0 are valid results
        value = Boolean(result) || result === false || result === 0 || result === null ? result : {}
        break
    } case `/session/${sessionId}/execute/async`: {
        const script = Function(body.script)
        let result
        script.call(this, ...body.args, (_result: any) => result = _result)
        value = result ?? {}
        break
    } case `${path}/${sessionId}/element/${genericElementId}/elements`:
        value = [
            { [ELEMENT_KEY]: genericSubElementId, index: 0 },
            { [ELEMENT_KEY]: 'some-elem-456', index: 1 },
            { [ELEMENT_KEY]: 'some-elem-789', index: 2 },
        ]
        break
    case `${path}/${sessionId}/shadow/${genericShadowElementId}/elements`:
        value = [
            { [ELEMENT_KEY]: genericSubShadowElementId, index: 0 },
            { [ELEMENT_KEY]: 'some-sub-shadow-elem-456', index: 1 },
            { [ELEMENT_KEY]: 'some-sub-shadow-elem-789', index: 2 },
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
            return Response.json(response, {
                status: 200,
                headers: { foo: 'bar' }
            })
        }

        // https://www.w3.org/TR/webdriver1/#handling-errors
        const error = {
            value: {
                'error': 'stale element reference',
                'message': 'element is not attached to the page document'
            }
        }

        return Response.json(error, {
            status: 404,
            headers: { foo: 'bar' }
        })
    }

    /**
     * empty response
     */
    if (uri.pathname === '/empty') {
        return Response.json('', {
            status: 500,
            headers: { foo: 'bar' }
        })
    }

    /**
     * session error due to wrong path
     */
    if (uri.pathname === '/wrong/path') {
        return Response.json({}, {
            status: 404,
            headers: { foo: 'bar' }
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

            return Response.json(response, {
                status: 200,
                headers: { foo: 'bar' }
            })
        }

        return Response.json({}, {
            status: 400,
            headers: { foo: 'bar' }
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

    return Response.json(response, {
        status: statusCode,
        headers: { foo: 'bar' }
    })
})

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

vi.stubGlobal('fetch', requestMock)
