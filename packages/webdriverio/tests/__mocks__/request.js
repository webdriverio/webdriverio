import { ELEMENT_KEY } from '../../src/constants'

let manualMockResponse

const sessionId = 'foobar-123'
const genericElementId = 'some-elem-123'
const genericSubElementId = 'some-sub-elem-321'
const requestMock = jest.fn().mockImplementation((params, cb) => {
    let value = {}
    let sessionResponse = {
        sessionId,
        capabilities: {
            browserName: 'mockBrowser'
        }
    }

    if (params.body && params.body.capabilities && params.body.capabilities.jsonwpMode) {
        sessionResponse = {
            sessionId,
            browserName: 'mockBrowser'
        }
    }

    switch (params.uri.path) {
    case '/wd/hub/session':
        value = sessionResponse

        if (params.body.capabilities.browserName.includes('noW3C')) {
            value.desiredCapabilities = { browserName: 'mockBrowser' }
            delete value.capabilities
        }

        break
    case `/wd/hub/session/${sessionId}/element`:
        value = {
            [ELEMENT_KEY]: genericElementId
        }
        break
    case `/wd/hub/session/${sessionId}/element/some-elem-123/element`:
        value = {
            [ELEMENT_KEY]: genericSubElementId
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
        value = script.apply(this, args) || {}
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
        value = 'WebdriverIO - WebDriver bindings for Node.js'
        break
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
    if (Array.isArray(manualMockResponse)) {
        value = manualMockResponse.shift() || value

        if (manualMockResponse.length === 0) {
            manualMockResponse = null
        }
    } else if (manualMockResponse) {
        value = manualMockResponse
        manualMockResponse = null
    }

    let response = { value }
    if (params.jsonwpMode) {
        response = { value, sessionId, status: 0 }
    }

    cb(null, {
        headers: { foo: 'bar' },
        statusCode: 200,
        body: response
    }, response)
})

requestMock.retryCnt = 0
requestMock.setMockResponse = (value) => {
    manualMockResponse = value
}

export default requestMock
