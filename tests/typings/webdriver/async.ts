import WebDriver from 'webdriver'

;(async () => {
    const client = await WebDriver.newSession({
        hostname: '',
        transformRequest: (options) => {
            options.body = 'other body'
            return options
        },
        transformResponse: (res, options) => {
            res.rawBody = Buffer.from(options.body.toString())
            return res
        },
        capabilities: {
            alwaysMatch: {},
            firstMatch: [{
                'sauce:options': {
                    name: 'foo'
                },
                'appium:autoWebview': true,
                // @ts-expect-error no JSONWire caps allowed
                platform: 'foo'
            }],
            browserName: 'foo'
        }
    })

    const rect = await client.getWindowRect()
    rect.height.toFixed()

    const newClient = WebDriver.attachToSession({
        sessionId: client.sessionId
    })

    const sessionId = await WebDriver.reloadSession(newClient)
    sessionId.toUpperCase()
})
