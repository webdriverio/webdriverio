import { ELEMENT_KEY } from '../../src/constants'

const sessionId = 'foobar-123'
const request = jest.fn().mockImplementation((params, cb) => {
    let value = {}

    switch (params.uri.path) {
    case '/wd/hub/session':
        value = {
            sessionId,
            capabilities: {
                browserName: 'mockBorwser'
            }
        }
        break;
    case `/wd/hub/session/${sessionId}/element`:
        value = {
            [ELEMENT_KEY]: 'some-elem-123'
        }
        break;
    case `/wd/hub/session/${sessionId}/elements`:
        value = [
            { [ELEMENT_KEY]: 'some-elem-123' },
            { [ELEMENT_KEY]: 'some-elem-456' },
            { [ELEMENT_KEY]: 'some-elem-789' },
        ]
        break;
    }

    cb(null, {
        headers: { foo: 'bar' },
        statusCode: 200,
        body: { value }
    }, {
        value
    })
})

export default request
