import { ELEMENT_KEY } from '../../src/constants'

let manualMockResponse

const defaultSessionId = 'foobar-123'
let sessionId = defaultSessionId
const genericElementId = 'some-elem-123'
const genericSubElementId = 'some-sub-elem-321'
const genericSubSubElementId = 'some-sub-sub-elem-231'
const requestMock = jest.fn().mockImplementation((params, cb) => {
    let value = {}
    let jsonwpMode = false
    let sessionResponse = {
        sessionId,
        capabilities: {
            browserName: 'mockBrowser',
            platformName: 'node',
            browserVersion: '1234',
            setWindowRect: true
        }
    }

    if (
        params.body &&
        params.body.capabilities &&
        params.body.capabilities.alwaysMatch.jsonwpMode
    ) {
        jsonwpMode = true
        sessionResponse = {
            sessionId,
            browserName: 'mockBrowser'
        }
    }

    if (
        params.body &&
        params.body.capabilities &&
        params.body.capabilities.alwaysMatch.mobileMode
    ) {
        sessionResponse.capabilities.deviceName = 'iNode'
    }

    if (
        params.body &&
        params.body.capabilities &&
        params.body.capabilities.alwaysMatch.keepBrowserName
    ) {
        sessionResponse.capabilities.browserName = params.body.capabilities.alwaysMatch.browserName
    }

    switch (params.uri.path) {
    case '/wd/hub/session':
        value = sessionResponse

        if (params.body.capabilities.alwaysMatch.browserName && params.body.capabilities.alwaysMatch.browserName.includes('noW3C')) {
            value.desiredCapabilities = { browserName: 'mockBrowser' }
            delete value.capabilities
        }

        break
    case `/wd/hub/session/${sessionId}/element`:
        if (params.body && params.body.value === '#nonexisting') {
            value = { elementId: null }
            break
        }

        if (params.body && params.body.value === '#slowRerender') {
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
    case `/wd/hub/session/${sessionId}/element/some-elem-123/element`:
        value = {
            [ELEMENT_KEY]: genericSubElementId
        }
        break
    case `/wd/hub/session/${sessionId}/element/${genericSubElementId}/element`:
        value = {
            [ELEMENT_KEY]: genericSubSubElementId
        }
        break
    case `/wd/hub/session/${sessionId}/element/${genericElementId}/rect`:
        value = {
            x: 15,
            y: 20,
            height: 30,
            width: 50
        }
        break
    case `/wd/hub/session/${sessionId}/element/${genericSubElementId}/rect`:
        value = {
            x: 100,
            y: 200,
            height: 120,
            width: 150
        }
        break
    case `/wd/hub/session/${sessionId}/element/${genericElementId}/size`:
        value = {
            height: 30,
            width: 50
        }
        break
    case `/wd/hub/session/${sessionId}/element/${genericElementId}/location`:
        value = {
            x: 15,
            y: 20
        }
        break
    case `/wd/hub/session/${sessionId}/element/${genericElementId}/displayed`:
        value = true
        break
    case `/wd/hub/session/${sessionId}/elements`:
        value = [
            { [ELEMENT_KEY]: genericElementId },
            { [ELEMENT_KEY]: 'some-elem-456' },
            { [ELEMENT_KEY]: 'some-elem-789' },
        ]
        break
    case `/wd/hub/session/${sessionId}/element/${genericElementId}/css/width`:
        value = '1250px'
        break
    case `/wd/hub/session/${sessionId}/element/${genericElementId}/property/tagName`:
        value = 'BODY'
        break
    case `/wd/hub/session/${sessionId}/execute`:
    case `/wd/hub/session/${sessionId}/execute/sync`: {
        const script = Function(params.body.script)
        const args = params.body.args.map(arg => arg.ELEMENT || arg[ELEMENT_KEY] || arg)

        let result = null
        if (params.body.script.includes('resq')) {
            if (params.body.script.includes('react$$')) {
                result = [
                    { [ELEMENT_KEY]: genericElementId },
                    { [ELEMENT_KEY]: 'some-elem-456' },
                    { [ELEMENT_KEY]: 'some-elem-789' },
                ]
            } else if (params.body.script.includes('react$')) {
                result = args[0] === 'myNonExistingComp'
                    ? new Error('foobar')
                    : { [ELEMENT_KEY]: genericElementId }
            } else {
                result = null
            }
        } else if (params.body.script.includes('testLocatorStrategy')) {
            result = { [ELEMENT_KEY]: genericElementId }
        } else if (params.body.script.includes('testLocatorStrategiesMultiple')) {
            result = [
                { [ELEMENT_KEY]: genericElementId },
                { [ELEMENT_KEY]: 'some-elem-456' },
                { [ELEMENT_KEY]: 'some-elem-789' },
            ]
        } else {
            result = script.apply(this, args)
        }

        //false and 0 are valid results
        value = Boolean(result) || result === false || result === 0 || result === null ? result : {}
        break
    } case `/wd/hub/session/${sessionId}/element/${genericElementId}/elements`:
        value = [
            { [ELEMENT_KEY]: genericSubElementId },
            { [ELEMENT_KEY]: 'some-elem-456' },
            { [ELEMENT_KEY]: 'some-elem-789' },
        ]
        break
    case `/wd/hub/session/${sessionId}/cookie`:
        value = [
            { name: 'cookie1', value: 'dummy-value-1' },
            { name: 'cookie2', value: 'dummy-value-2' },
            { name: 'cookie3', value: 'dummy-value-3' },
        ]
        break
    case `/wd/hub/session/${sessionId}/window/handles`:
        value = ['window-handle-1', 'window-handle-2', 'window-handle-3']
        break
    case `/wd/hub/session/${sessionId}/url`:
        value = 'https://webdriver.io/?foo=bar'
        break
    case `/wd/hub/session/${sessionId}/title`:
        value = 'WebdriverIO · Next-gen WebDriver test framework for Node.js'
        break
    case `/wd/hub/session/${sessionId}/screenshot`:
    case `/wd/hub/session/${sessionId}/appium/stop_recording_screen`:
        value = Buffer.from('some screenshot').toString('base64')
        break
    case `/wd/hub/session/${sessionId}/element/${genericElementId}/screenshot`:
        value = Buffer.from('some element screenshot').toString('base64')
        break
    case '/grid/api/hub':
        value = { some: 'config' }
        break
    case '/grid/api/testsession':
        value = '<!DOCTYPE html><html lang="en"></html>'
        break
    }

    if (params.uri.path && params.uri.path.startsWith(`/wd/hub/session/${sessionId}/element/`) && params.uri.path.includes('/attribute/')) {
        value = `${params.uri.path.substring(params.uri.path.lastIndexOf('/') + 1)}-value`
    }

    /**
     * Simulate a stale element
     */

    if (params.uri.path === `/wd/hub/session/${sessionId}/element/${genericSubSubElementId}/click`) {
        ++requestMock.retryCnt

        if (requestMock.retryCnt > 1) {
            const response = { value: null }
            return cb(null, {
                headers: { foo: 'bar' },
                statusCode: 200,
                body: response
            }, response)
        }

        // https://www.w3.org/TR/webdriver1/#handling-errors
        let error = {
            value: {
                'error': 'stale element reference',
                'message': 'element is not attached to the page document'
            }
        }

        return cb(null, {
            headers: { foo: 'bar' },
            statusCode: 404,
            body: error
        }, error)
    }

    /**
     * empty response
     */
    if (params.uri.path === '/wd/hub/empty') {
        return cb(null, {
            headers: { foo: 'bar' },
            statusCode: 500,
            body: ''
        })
    }

    /**
     * simulate failing response
     */
    if (params.uri.path === '/wd/hub/failing') {
        ++requestMock.retryCnt

        /**
         * success this request if you retry 3 times
         */
        if (requestMock.retryCnt > 3) {
            const response = { value: 'caught' }
            return cb(null, {
                headers: { foo: 'bar' },
                statusCode: 200,
                body: response
            }, response)
        }

        return cb(new Error('Could not send request'), {
            headers: { foo: 'bar' },
            statusCode: 400,
            body: {}
        }, {})
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

    let response = { value }
    if (jsonwpMode) {
        response = { value, sessionId, status: 0 }
    }
    if (params.uri && params.uri.path && params.uri.path.startsWith('/grid')) {
        response = response.value
    }

    cb(null, {
        headers: { foo: 'bar' },
        statusCode,
        body: response
    }, response)
})

requestMock.retryCnt = 0
requestMock.setMockResponse = (value) => {
    manualMockResponse = value
}

requestMock.getSessionId = () => sessionId
requestMock.setSessionId = (newSessionId) => {
    sessionId = newSessionId
}
requestMock.resetSessionId = () => {
    sessionId = defaultSessionId
}

export default requestMock
