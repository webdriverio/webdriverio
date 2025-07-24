import { describe, it, expect } from 'vitest'
import { type remote, type local } from 'webdriver'

let customStack: undefined | string

// @ts-expect-error
globalThis.Error = class extends Error {
    constructor(message?: string | undefined) {
        super(message)
        this.name = 'Error'

        if (customStack) {
            this.stack = customStack
        }
    }
}

/**
 * dynamically import here so we can mock the Error class first
 */
const { parseScriptResult } = await import('../../../src/utils/bidi/index.js')

const params: remote.ScriptCallFunctionParameters = {
    functionDeclaration: 'function anonymous(\n) {\n\n            return (/* __wdio script__ */()=>{function callMe(arg1,arg2){return arg1+arg2}__name(callMe,"callMe");console.log("Hello World");if(true){console.log("foobar");callMe(1,2);if(true){throw new Error("foobar")}}}/* __wdio script end__ */).apply(this, arguments);\n        \n}',
    awaitPromise: true,
    arguments: [],
    target: {
        context: 'fd71377d-5056-43bd-9d7c-90c656c0c5c9'
    }
}

const exception: local.ScriptEvaluateResult = {
    realm: '41fba2cf-714c-40ce-b686-1588a04df3cd',
    type: 'exception',
    exceptionDetails: {
        columnNumber: 199,
        exception: {
            type: 'error'
        },
        lineNumber: 3,
        stackTrace: {
            callFrames: [
                {
                    columnNumber: 199,
                    functionName: 'anonymous/<',
                    lineNumber: 3,
                    url: 'https://webdriver.io/'
                },
                {
                    columnNumber: 248,
                    functionName: 'anonymous',
                    lineNumber: 3,
                    url: 'https://webdriver.io/'
                },
                {
                    columnNumber: 3,
                    functionName: '',
                    lineNumber: 5,
                    url: 'https://webdriver.io/'
                }
            ]
        },
        text: 'Error: foobar'
    }
}

function getErrorStack () {
    let error: Error | undefined
    try {
        parseScriptResult(params, exception)
    } catch (e) {
        error = e as Error
    }

    if (!error) {
        throw new Error('parseScriptResult did not throw an error')
    }

    return error.stack
}

describe('getFailureLine', () => {
    it('standalone: should return normal stacktrace', () => {
        expect(getErrorStack()).toContain('WebdriverBidiExeception: Error: foobar\n    at parseScriptResult')
    })

    it('testrunner windows: should find the correct line', () => {
        customStack = `Error: Error: Hello Bidi
    at parseScriptResult (d:/a/webdriverio/webdriverio/packages/webdriverio/build/index.js:750:19)
    at Browser.execute (d:/a/webdriverio/webdriverio/packages/webdriverio/build/index.js:2982:12)
    at Browser.wrapCommandFn (d:/a/webdriverio/webdriverio/packages/wdio-utils/build/index.js:1368:23)
    at Context.<anonymous> (d:\\a\\webdriverio\\webdriverio\\e2e\\wdio\\headless\\bidi.e2e.ts:207:28)
    at Context.executeAsync (d:/a/webdriverio/webdriverio/packages/wdio-utils/build/index.js:1488:20)
    at Context.testFrameworkFnWrapper (d:/a/webdriverio/webdriverio/packages/wdio-utils/build/index.js:1559:14)`

        expect(getErrorStack()).toContain(`Error: Error: Hello Bidi
    at Context.<anonymous> (d:\\a\\webdriverio\\webdriverio\\e2e\\wdio\\headless\\bidi.e2e.ts:207:28)
      207 │ if(true){throw new Error("foobar")}}}
          ╵ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    at`)
    })

    it('testrunner linux: should find the correct line', () => {
        params.functionDeclaration = (
            'function anonymous(\n' +
            ') {\n' +
            '\n' +
            '            return (/* __wdio script__ */() => {\n' +
            '            function callMe (arg1, arg2) {\n' +
            '                return arg1 + arg2\n' +
            '            }\n' +
            "            console.log('Hello World');\n" +
            '            if (true) {\n' +
            "                console.log('foobar')\n" +
            '                callMe(1, 2)\n' +
            '                if (true) {\n' +
            "                    throw new Error('foobar')\n" +
            '                }\n' +
            '            }\n' +
            '        }/* __wdio script end__ */).apply(this, arguments);\n' +
            '        \n' +
            '}'
        )

        exception.exceptionDetails = {
            columnNumber: 20,
            exception: {
                type: 'error'
            },
            lineNumber: 18,
            stackTrace: {
                callFrames: [
                    {
                        columnNumber: 26,
                        functionName: '',
                        lineNumber: 18,
                        url: ''
                    },
                    {
                        columnNumber: 36,
                        functionName: 'anonymous',
                        lineNumber: 21,
                        url: ''
                    },
                    {
                        columnNumber: 17,
                        functionName: 'callFunction',
                        lineNumber: 3,
                        url: ''
                    },
                    {
                        columnNumber: 13,
                        functionName: '',
                        lineNumber: 5,
                        url: ''
                    }
                ]
            },
            text: 'Error: foobar'
        }

        customStack = `Error: foobar
    at parseScriptResult (/path/to/webdriverio/packages/webdriverio/build/index.js:816:11)
    at Browser.execute (/path/to/webdriverio/packages/webdriverio/build/index.js:3007:12)
    at Browser.wrapCommandFn (/path/to/webdriverio/packages/wdio-utils/build/index.js:1368:23)
    at async Context.<anonymous> (file:///path/to/webdriverio/examples/wdio/mocha/mocha.test.js:8:24)
    at Context.executeAsync (/path/to/webdriverio/packages/wdio-utils/build/index.js:1488:20)
    at Context.testFrameworkFnWrapper (/path/to/webdriverio/packages/wdio-utils/build/index.js:1559:14)`

        expect(getErrorStack()).toContain(`Error: foobar
    at async Context.<anonymous> (file:///path/to/webdriverio/examples/wdio/mocha/mocha.test.js:8:24)
      8 │ throw new Error('foobar')
        ╵ ~~~~~~~~~~~~~~~~~~~~~~~~~

    at`)
    })
})
