import type { EventEmitter } from 'node:events'
import { deepmergeCustom } from 'deepmerge-ts'

import logger from '@wdio/logger'
import type { Protocol } from '@wdio/protocols'
import {
    WebDriverProtocol, MJsonWProtocol, JsonWProtocol, AppiumProtocol, ChromiumProtocol,
    SauceLabsProtocol, SeleniumProtocol, GeckoProtocol, WebDriverBidiProtocol
} from '@wdio/protocols'
import { transformCommandLogResult } from '@wdio/utils'
import { CAPABILITY_KEYS } from '@wdio/protocols'
import type { Options, Capabilities } from '@wdio/types'

import RequestFactory from './request/factory.js'
import command from './command.js'
import { BidiHandler } from './bidi/handler.js'
import type { Event } from './bidi/localTypes.js'
import { REG_EXPS } from './constants.js'
import type { WebDriverResponse } from './request/index.js'
import type { Client, JSONWPCommandError, SessionFlags } from './types.js'

const log = logger('webdriver')
const deepmerge = deepmergeCustom({ mergeArrays: false })

const BROWSER_DRIVER_ERRORS = [
    'unknown command: wd/hub/session', // chromedriver
    'HTTP method not allowed', // geckodriver
    "'POST /wd/hub/session' was not found.", // safaridriver
    'Command not found' // iedriver
]

/**
 * start browser session with WebDriver protocol
 */
export async function startWebDriverSession (params: Options.WebDriver): Promise<{ sessionId: string, capabilities: Capabilities.DesiredCapabilities }> {
    /**
     * validate capabilities to check if there are no obvious mix between
     * JSONWireProtocol and WebDriver protocol, e.g.
     */
    if (params.capabilities) {
        const extensionCaps = Object.keys(params.capabilities).filter((cap) => cap.includes(':'))
        const invalidWebDriverCaps = Object.keys(params.capabilities)
            .filter((cap) => !CAPABILITY_KEYS.includes(cap) && !cap.includes(':'))

        /**
         * if there are vendor extensions, e.g. sauce:options or appium:app
         * used (only WebDriver compatible) and caps that aren't defined
         * in the WebDriver spec
         */
        if (extensionCaps.length && invalidWebDriverCaps.length) {
            throw new Error(
                `Invalid or unsupported WebDriver capabilities found ("${invalidWebDriverCaps.join('", "')}"). ` +
                'Ensure to only use valid W3C WebDriver capabilities (see https://w3c.github.io/webdriver/#capabilities).' +
                'If you run your tests on a remote vendor, like Sauce Labs or BrowserStack, make sure that you put them ' +
                'into vendor specific capabilities, e.g. "sauce:options" or "bstack:options". Please reach out ' +
                'to your vendor support team if you have further questions.'
            )
        }
    }

    /**
     * the user could have passed in either w3c style or jsonwp style caps
     * and we want to pass both styles to the server, which means we need
     * to check what style the user sent in so we know how to construct the
     * object for the other style
     */
    const [w3cCaps, jsonwpCaps] = params.capabilities && (params.capabilities as Capabilities.W3CCapabilities).alwaysMatch
        /**
         * in case W3C compliant capabilities are provided
         */
        ? [params.capabilities, (params.capabilities as Capabilities.W3CCapabilities).alwaysMatch]
        /**
         * otherwise assume they passed in jsonwp-style caps (flat object)
         */
        : [{ alwaysMatch: params.capabilities, firstMatch: [{}] }, params.capabilities]

    const sessionRequest = await RequestFactory.getInstance(
        'POST',
        '/session',
        {
            capabilities: w3cCaps, // W3C compliant
            desiredCapabilities: jsonwpCaps // JSONWP compliant
        }
    )

    let response
    try {
        response = await sessionRequest.makeRequest(params)
    } catch (err: any) {
        log.error(err)
        const message = getSessionError(err, params)
        throw new Error('Failed to create session.\n' + message)
    }
    const sessionId = response.value.sessionId || response.sessionId

    /**
     * save actual received session details
     */
    params.capabilities = response.value.capabilities || response.value

    return { sessionId, capabilities: params.capabilities as Capabilities.DesiredCapabilities }
}

/**
 * check if WebDriver requests was successful
 * @param  {number}  statusCode status code of request
 * @param  {Object}  body       body payload of response
 * @return {Boolean}            true if request was successful
 */
export function isSuccessfulResponse (statusCode?: number, body?: WebDriverResponse) {
    /**
     * response contains a body
     */
    if (!body || typeof body.value === 'undefined') {
        log.debug('request failed due to missing body')
        return false
    }

    /**
     * ignore failing element request to enable lazy loading capability
     */
    if (
        body.status === 7 && body.value && body.value.message &&
        (
            body.value.message.toLowerCase().startsWith('no such element') ||
            // Appium
            body.value.message === 'An element could not be located on the page using the given search parameters.' ||
            // Internet Explorer
            body.value.message.toLowerCase().startsWith('unable to find element')
        )
    ) {
        return true
    }

    /**
     * if it has a status property, it should be 0
     * (just here to stay backwards compatible to the jsonwire protocol)
     */
    if (body.status && body.status !== 0) {
        log.debug(`request failed due to status ${body.status}`)
        return false
    }

    const hasErrorResponse = body.value && (body.value.error || body.value.stackTrace || body.value.stacktrace)

    /**
     * check status code
     */
    if (statusCode === 200 && !hasErrorResponse) {
        return true
    }

    /**
     * if an element was not found we don't flag it as failed request because
     * we lazy load it
     */
    if (statusCode === 404 && body.value && body.value.error === 'no such element') {
        return true
    }

    /**
     * that has no error property (Appium only)
     */
    if (hasErrorResponse) {
        log.debug('request failed due to response error:', body.value.error)
        return false
    }

    return true
}

/**
 * creates the base prototype for the webdriver monad
 */
export function getPrototype ({ isW3C, isChromium, isFirefox, isMobile, isSauce, isSeleniumStandalone }: Partial<SessionFlags>) {
    const prototype: Record<string, PropertyDescriptor> = {}
    const ProtocolCommands: Protocol = deepmerge(
        /**
         * if mobile apply JSONWire and WebDriver protocol because
         * some legacy JSONWire commands are still used in Appium
         * (e.g. set/get geolocation)
         */
        isMobile
            ? deepmerge(JsonWProtocol, WebDriverProtocol)
            : isW3C ? WebDriverProtocol : JsonWProtocol,
        /**
         * enable Bidi protocol for W3C sessions
         */
        isW3C ? WebDriverBidiProtocol : {},
        /**
         * only apply mobile protocol if session is actually for mobile
         */
        isMobile ? deepmerge(MJsonWProtocol, AppiumProtocol) : {},
        /**
         * only apply special Chromium commands if session is using Chrome or Edge
         */
        isChromium ? ChromiumProtocol : {},
        /**
         * only apply special Firefox commands if session is using Firefox
         */
        isFirefox ? GeckoProtocol : {},
        /**
         * only Sauce Labs specific vendor commands
         */
        isSauce ? SauceLabsProtocol : {},
        /**
         * only apply special commands when running tests using
         * Selenium Grid or Selenium Standalone server
         */
        isSeleniumStandalone ? SeleniumProtocol : {},
        {} as Protocol
    )

    for (const [endpoint, methods] of Object.entries(ProtocolCommands)) {
        for (const [method, commandData] of Object.entries(methods)) {
            prototype[commandData.command] = { value: command(method, endpoint, commandData, isSeleniumStandalone) }
        }
    }

    return prototype
}

/**
 * helper method to determine the error from webdriver response
 * @param  {Object} body body object
 * @return {Object} error
 */
export function getErrorFromResponseBody (body: any, requestOptions: any) {
    if (!body) {
        return new Error('Response has empty body')
    }

    if (typeof body === 'string' && body.length) {
        return new Error(body)
    }

    if (typeof body !== 'object') {
        return new Error('Unknown error')
    }

    return new CustomRequestError(body, requestOptions)
}

//Exporting for testability
export class CustomRequestError extends Error {
    constructor (body: WebDriverResponse, requestOptions: any) {
        const errorObj = body.value || body
        let errorMessage = errorObj.message || errorObj.class || 'unknown error'

        /**
         * improve error message for Chrome and Safari on invalid selectors
         */
        if (typeof errorObj.error === 'string' && errorObj.error.includes('invalid selector')) {
            errorMessage = (
                `The selector "${requestOptions.value}" used with strategy "${requestOptions.using}" is invalid! ` +
                'For more information on selectors visit the WebdriverIO docs at: https://webdriver.io/docs/selectors'
            )
        }

        super(errorMessage)
        if (errorObj.error) {
            this.name = errorObj.error
        } else if (errorObj.message && errorObj.message.includes('stale element reference')) {
            this.name = 'stale element reference'
        } else {
            this.name = errorObj.name || 'WebDriver Error'
        }

        Error.captureStackTrace(this, CustomRequestError)
    }
}

/**
 * return all supported flags and return them in a format so we can attach them
 * to the instance protocol
 * @param  {Object} options   driver instance or option object containing these flags
 * @return {Object}           prototype object
 */
export function getEnvironmentVars({ isW3C, isMobile, isIOS, isAndroid, isFirefox, isSauce, isSeleniumStandalone, isBidi, isChromium }: Partial<SessionFlags>): PropertyDescriptorMap {
    return {
        isW3C: { value: isW3C },
        isMobile: { value: isMobile },
        isIOS: { value: isIOS },
        isAndroid: { value: isAndroid },
        isFirefox: { value: isFirefox },
        isSauce: { value: isSauce },
        isSeleniumStandalone: { value: isSeleniumStandalone },
        isBidi: { value: isBidi },
        isChromium: { value: isChromium },
    }
}

/**
 * Decorate the client's options object with host updates based on the presence of
 * directConnect capabilities in the new session response. Note that this
 * mutates the object.
 * @param  {Client} params post-new-session client
 */
export function setupDirectConnect(client: Client) {
    const capabilities = client.capabilities as Capabilities.DesiredCapabilities
    const directConnectProtocol = capabilities['appium:directConnectProtocol']
    const directConnectHost = capabilities['appium:directConnectHost']
    const directConnectPath = capabilities['appium:directConnectPath']
    const directConnectPort = capabilities['appium:directConnectPort']
    if (directConnectProtocol && directConnectHost && directConnectPort &&
        (directConnectPath || directConnectPath === '')) {
        log.info('Found direct connect information in new session response. ' +
            `Will connect to server at ${directConnectProtocol}://` +
            `${directConnectHost}:${directConnectPort}${directConnectPath}`)
        client.options.protocol = directConnectProtocol
        client.options.hostname = directConnectHost
        client.options.port = directConnectPort
        client.options.path = directConnectPath
    }
}

/**
 * get human readable message from response error
 * @param {Error} err response error
 */
export const getSessionError = (err: JSONWPCommandError, params: Partial<Options.WebDriver> = {}) => {
    // browser driver / service is not started
    if (err.code === 'ECONNREFUSED') {
        return `Unable to connect to "${params.protocol}://${params.hostname}:${params.port}${params.path}", make sure browser driver is running on that address.` +
            '\nIt seems like the service failed to start or is rejecting any connections.'
    }

    if (err.message === 'unhandled request') {
        return 'The browser driver couldn\'t start the session. Make sure you have set the "path" correctly!'
    }

    if (!err.message) {
        return 'See wdio.* logs for more information.'
    }

    // wrong path: selenium-standalone
    if (err.message.includes('Whoops! The URL specified routes to this help page.')) {
        return "It seems you are running a Selenium Standalone server and point to a wrong path. Please set `path: '/wd/hub'` in your wdio.conf.js!"
    }

    // wrong path: chromedriver, geckodriver, etc
    if (BROWSER_DRIVER_ERRORS.some(m => err && err.message && err.message.includes(m))) {
        return "Make sure to set `path: '/'` in your wdio.conf.js!"
    }

    // edge driver on localhost
    if (err.message.includes('Bad Request - Invalid Hostname') && err.message.includes('HTTP Error 400')) {
        return "Run edge driver on 127.0.0.1 instead of localhost, ex: --host=127.0.0.1, or set `hostname: 'localhost'` in your wdio.conf.js"
    }

    const w3cCapMessage = '\nMake sure to add vendor prefix like "goog:", "appium:", "moz:", etc to non W3C capabilities.' +
        '\nSee more https://www.w3.org/TR/webdriver/#capabilities'

    // Illegal w3c capability passed to selenium standalone
    if (err.message.includes('Illegal key values seen in w3c capabilities')) {
        return err.message + w3cCapMessage
    }

    // wrong host/port, port in use, illegal w3c capability passed to selenium grid
    if (err.message === 'Response has empty body') {
        return 'Make sure to connect to valid hostname:port or the port is not in use.' +
            '\nIf you use a grid server ' + w3cCapMessage
    }

    if (err.message.includes('failed serving request POST /wd/hub/session: Unauthorized') && params.hostname?.endsWith('saucelabs.com')) {
        return 'Session request was not authorized because you either did provide a wrong access key or tried to run ' +
            'in a region that has not been enabled for your user. If have registered a free trial account it is connected ' +
            'to a specific region. Ensure this region is set in your configuration (https://webdriver.io/docs/options.html#region).'
    }

    return err.message
}

/**
 * return timeout error with information about the executing command on which the test hangs
 */
export const getTimeoutError = (error: Error, requestOptions: Options.RequestLibOptions): Error => {
    const cmdName = getExecCmdName(requestOptions)
    const cmdArgs = getExecCmdArgs(requestOptions)

    const cmdInfoMsg = `when running "${cmdName}" with method "${requestOptions.method}"`
    const cmdArgsMsg = cmdArgs ? ` and args ${cmdArgs}` : ''

    const timeoutErr = new Error(`${error.message} ${cmdInfoMsg}${cmdArgsMsg}`)
    return Object.assign(timeoutErr, error)
}

function getExecCmdName(requestOptions: Options.RequestLibOptions): string {
    const { href } = requestOptions.url as URL
    const res = href.match(REG_EXPS.commandName) || []

    return res[1] || href
}

function getExecCmdArgs(requestOptions: Options.RequestLibOptions): string {
    const { json: cmdJson } = requestOptions

    if (typeof cmdJson !== 'object') {
        return ''
    }

    const transformedRes = transformCommandLogResult(cmdJson)

    if (typeof transformedRes === 'string') {
        return transformedRes
    }

    if (typeof cmdJson.script === 'string') {
        const scriptRes = cmdJson.script.match(REG_EXPS.execFn) || []

        return `"${scriptRes[1] || cmdJson.script}"`
    }

    return Object.keys(cmdJson).length ? `"${JSON.stringify(cmdJson)}"` : ''
}

/**
 * Enhance the monad with WebDriver Bidi primitives if a connection can be established successfully
 * @param socketUrl url to bidi interface
 * @returns prototype with interface for bidi primitives
 */
export function initiateBidi (socketUrl: string, strictSSL: boolean = true): PropertyDescriptorMap {
    socketUrl = socketUrl.replace('localhost', '127.0.0.1')
    const bidiReqOpts = strictSSL ? {} : { rejectUnauthorized: false }
    const handler = new BidiHandler(socketUrl, bidiReqOpts)
    handler.connect().then(() => log.info(`Connected to WebDriver Bidi interface at ${socketUrl}`))

    return {
        _bidiHandler: { value: handler },
        ...Object.values(WebDriverBidiProtocol).map((def) => def.socket).reduce((acc, cur) => {
            acc[cur.command] = {
                value: handler[cur.command]?.bind(handler)
            }
            return acc
        }, {} as PropertyDescriptorMap)
    }
}

export function parseBidiMessage (this: EventEmitter, data: Buffer) {
    try {
        // keep backwards compatibility
        // ToDo(Christian): remove in v9
        this.emit('message', data)

        const payload: Event = JSON.parse(data.toString())
        if (payload.type !== 'event') {
            return
        }
        this.emit(payload.method, payload.params)
    } catch (err: unknown) {
        log.error(`Failed parse WebDriver Bidi message: ${(err as Error).message}`)
    }
}
