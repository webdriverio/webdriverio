export const BASE_PROTOCOL_SPEC = {
    sendCommand: {
        socket: {
            command: 'send',
            description: 'Send socket commands via WebDriver Bidi',
            ref: 'https://github.com/w3c/webdriver-bidi',
            parameters: [
                {
                    name: 'params',
                    type: 'CommandData',
                    description: 'socket payload',
                    required: true,
                },
            ],
            returns: {
                type: 'Object',
                name: 'CommandResponse',
                description: 'WebDriver Bidi response',
            },
        },
    },
    sendAsyncCommand: {
        socket: {
            command: 'sendAsync',
            description: 'Send asynchronous socket commands via WebDriver Bidi',
            ref: 'https://github.com/w3c/webdriver-bidi',
            parameters: [
                {
                    name: 'params',
                    type: 'CommandData',
                    description: 'socket payload',
                    required: true,
                },
            ],
            returns: {
                type: 'Number',
                name: 'id',
                description: 'id of WebDriver Bidi request',
            },
        },
    },
}
