import WebDriver from 'webdriver'
import { expectType } from 'tsd'

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
            alwaysMatch: {
                unhandledPromptBehavior: { default: 'ignore' }
            },
            firstMatch: [{
                'sauce:options': {
                    name: 'foo'
                },
                'appium:autoWebview': true,
                // @ts-expect-error unprefixed capability
                platform: 'foo'
            }, {
                unhandledPromptBehavior: 'dismiss and notify'
            }, {
                // @ts-expect-error the object form is the one WebdriverIO sends for BiDi
                unhandledPromptBehavior: { default: 'accept' }
            }, {
                // @ts-expect-error the object form is the one WebdriverIO sends for BiDi
                unhandledPromptBehavior: { beforeUnload: 'accept' }
            }],
            browserName: 'foo'
        }
    })

    const rect = await client.getWindowRect()
    expectType<number>(rect.height)

    const newClient = WebDriver.attachToSession({
        sessionId: client.sessionId
    })

    const sessionId = await WebDriver.reloadSession(newClient)
    expectType<string>(sessionId)
})
