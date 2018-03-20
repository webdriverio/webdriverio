import { ELEMENT_KEY } from '../../src/constants'

const sessionId = 'foobar-123'
const genericElementId = 'some-elem-123'
const genericSubElementId = 'some-sub-elem-321'
export default jest.fn().mockImplementation((params, cb) => {
    let value = {}
    let sessionResponse = {
        sessionId,
        capabilities: {
            browserName: 'mockBrowser'
        }
    }

    if (params.body.capabilities && params.body.capabilities.jsonwpMode) {
        sessionResponse = {
            sessionId,
            browserName: 'mockBrowser'
        }
    }

    switch (params.uri.path) {
    case '/wd/hub/session':
        value = sessionResponse
        break;
    case `/wd/hub/session/${sessionId}/element`:
        value = {
            [ELEMENT_KEY]: genericElementId
        }
        break;
    case `/wd/hub/session/${sessionId}/element/some-elem-123/element`:
        value = {
            [ELEMENT_KEY]: genericSubElementId
        }
        break;
    case `/wd/hub/session/${sessionId}/element/${genericElementId}/rect`:
        value = {
            x: 15,
            y: 20,
            height: 30,
            width: 50
        }
        break;
    case `/wd/hub/session/${sessionId}/element/${genericElementId}/size`:
        value = {
            height: 30,
            width: 50
        }
        break;
    case `/wd/hub/session/${sessionId}/element/${genericElementId}/location`:
        value = {
            x: 15,
            y: 20
        }
        break;
    case `/wd/hub/session/${sessionId}/elements`:
        value = [
            { [ELEMENT_KEY]: genericElementId },
            { [ELEMENT_KEY]: 'some-elem-456' },
            { [ELEMENT_KEY]: 'some-elem-789' },
        ]
        break;
    case `/wd/hub/session/${sessionId}/element/some-elem-123/elements`:
        value = [
            { [ELEMENT_KEY]: genericSubElementId },
            { [ELEMENT_KEY]: 'some-elem-456' },
            { [ELEMENT_KEY]: 'some-elem-789' },
        ]
        break;
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
