import type { EventEmitter } from 'node:events'
import { deepmergeCustom } from 'deepmerge-ts'

import logger, { SENSITIVE_DATA_REPLACER } from '@wdio/logger'
import type { CommandEndpoint, Protocol } from '@wdio/protocols'
import {
    WebDriverProtocol, MJsonWProtocol, AppiumProtocol, ChromiumProtocol,
    SauceLabsProtocol, SeleniumProtocol, GeckoProtocol, WebDriverBidiProtocol
} from '@wdio/protocols'
import { CAPABILITY_KEYS } from '@wdio/protocols'
import type { Options } from '@wdio/types'

import command from './command.js'
import { environment } from './environment.js'
import { BidiHandler } from './bidi/handler.js'
import type { Event } from './bidi/localTypes.js'
import type { Client, JSONWPCommandError, SessionFlags, RemoteConfig, CommandRuntimeOptions } from './types.js'

const log = logger('webdriver')
const deepmerge = deepmergeCustom({ mergeArrays: false })

const BROWSER_DRIVER_ERRORS = [
    'unknown command: wd/hub/session', // chromedriver
    'HTTP method not allowed', // geckodriver
    "'POST /wd/hub/session' was not found.", // safaridriver
    'Command not found' // iedriver
]

interface SessionInitializationResponse {
    value: {
        sessionId?: string,
        capabilities?: WebdriverIO.Capabilities
    },
    sessionId: string
}

/**
 * start browser session with WebDriver protocol
 */
export async function startWebDriverSession (params: RemoteConfig): Promise<{ sessionId: string, capabilities: WebdriverIO.Capabilities }> {
    /**
     * the user could have passed in either w3c style or jsonwp style caps
     * and we want to pass both styles to the server, which means we need
     * to check what style the user sent in so we know how to construct the
     * object for the other style
     */
    const capabilities = params.capabilities && 'alwaysMatch' in params.capabilities
        /**
         * in case W3C compliant capabilities are provided
         */
        ? params.capabilities
        /**
         * otherwise assume they passed in jsonwp-style caps (flat object)
         */
        : { alwaysMatch: params.capabilities, firstMatch: [{}] }

    /**
     * automatically opt-into WebDriver Bidi (@ref https://w3c.github.io/webdriver-bidi/)
     */
    if (
        /**
         * except, if user does not want to opt-in
         */
        !capabilities.alwaysMatch['wdio:enforceWebDriverClassic'] &&
        /**
         * or user requests a Safari session which does not support Bidi
         */
        typeof capabilities.alwaysMatch.browserName === 'string' &&
        capabilities.alwaysMatch.browserName.toLowerCase() !== 'safari'
    ) {
        /**
         * opt-into WebDriver Bidi
         */
        capabilities.alwaysMatch.webSocketUrl = true
        /**
         * allow WebdriverIO to handle alerts
         */
        capabilities.alwaysMatch.unhandledPromptBehavior = 'ignore'
    }

    validateCapabilities(capabilities.alwaysMatch)
    const sessionRequest = new environment.value.Request(
        'POST',
        '/session',
        { capabilities }
    )

    let response: SessionInitializationResponse
    try {
        response = await sessionRequest.makeRequest(params) as SessionInitializationResponse
    } catch (err) {
        log.error(err)
        const message = getSessionError(err as Error, params)
        throw new Error(message)
    }
    const sessionId = response.value.sessionId || response.sessionId

    /**
     * save actual received session details
     */
    params.capabilities = (response.value.capabilities || response.value) as WebdriverIO.Capabilities

    return { sessionId, capabilities: params.capabilities }
}

/**
 * Validates the given WebdriverIO capabilities.
 *
 * @param {WebdriverIO.Capabilities} capabilities - The capabilities to validate.
 * @throws {Error} If the capabilities contain incognito mode.
 */
export function validateCapabilities (capabilities: WebdriverIO.Capabilities) {
    const chromeArgs = capabilities['goog:chromeOptions']?.args || []
    if (chromeArgs.includes('incognito') || chromeArgs.includes('--incognito')) {
        throw new Error(
            'Please remove "incognito" from `"goog:chromeOptions".args` as it is not supported running Chrome with WebDriver. ' +
            'WebDriver sessions are always incognito mode and do not persist across browser sessions.'
        )
    }

    /**
     * validate capabilities to check if there are no obvious mix between
     * JSONWireProtocol and WebDriver protocol, e.g.
     */
    if (capabilities) {
        const extensionCaps = Object.keys(capabilities).filter((cap) => cap.includes(':'))
        const invalidWebDriverCaps = Object.keys(capabilities)
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
}

/**
 * check if WebDriver requests was successful
 * @param  {number}  statusCode status code of request
 * @param  {Object}  body       body payload of response
 * @return {Boolean}            true if request was successful
 */
export function isSuccessfulResponse (statusCode?: number, body?: unknown) {
    /**
     * response contains a body
     */
    if (!body || typeof body !== 'object' || !('value' in body) || typeof body.value === 'undefined') {
        log.debug('request failed due to missing body')
        return false
    }

    /**
     * ignore failing element request to enable lazy loading capability
     */
    if (
        'status' in body && body.status === 7 && body.value && typeof body.value === 'object' &&
        'message' in body.value && body.value.message && typeof body.value.message === 'string' &&
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
    if ('status' in body && body.status && body.status !== 0) {
        log.debug(`request failed due to status ${body.status}`)
        return false
    }

    const hasErrorResponse = body.value && (
        (typeof body.value === 'object' && 'error' in body.value && body.value.error) ||
        (typeof body.value === 'object' && 'stackTrace' in body.value && body.value.stackTrace) ||
        (typeof body.value === 'object' && 'stacktrace' in body.value && body.value.stacktrace)
    )

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
    if (statusCode === 404 && typeof body.value === 'object' && body.value && 'error' in body.value && body.value.error === 'no such element') {
        return true
    }

    /**
     * that has no error property (Appium only)
     */
    if (hasErrorResponse) {
        const errMsg = typeof body.value === 'object' && body.value && 'error' in body.value ? body.value.error : body.value
        log.debug('request failed due to response error:', errMsg)
        return false
    }

    return true
}

/**
 * creates the base prototype for the webdriver monad
 */
export function getPrototype ({ isW3C, isChromium, isFirefox, isMobile, isSauce, isSeleniumStandalone }: Partial<SessionFlags>) {
    const prototype: Record<string, PropertyDescriptor> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ProtocolCommands = deepmerge<any>(
        /**
         * if mobile apply JSONWire and WebDriver protocol because
         * some legacy JSONWire commands are still used in Appium
         * (e.g. set/get geolocation)
         */
        isMobile
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? deepmerge<any>(AppiumProtocol as Protocol, WebDriverProtocol as Protocol) as Protocol
            : WebDriverProtocol,
        /**
         * enable Bidi protocol for W3C sessions
         */
        isW3C ? WebDriverBidiProtocol : {},
        /**
         * only apply mobile protocol if session is actually for mobile
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isMobile ? deepmerge<any>(MJsonWProtocol, AppiumProtocol) : {},
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
    ) as Protocol

    for (const [endpoint, methods] of Object.entries(ProtocolCommands)) {
        for (const [method, commandData] of Object.entries(methods)) {
            prototype[commandData.command] = { value: command(method, endpoint, commandData, isSeleniumStandalone) }
        }
    }

    return prototype
}

/**
 * return all supported flags and return them in a format so we can attach them
 * to the instance protocol
 * @param  {Object} options   driver instance or option object containing these flags
 * @return {Object}           prototype object
 */
export function getEnvironmentVars({ isW3C, isMobile, isIOS, isAndroid, isFirefox, isSauce, isSeleniumStandalone, isChromium, isWindowsApp, isMacApp }: Partial<SessionFlags>): PropertyDescriptorMap {
    return {
        isW3C: { value: isW3C },
        isMobile: { value: isMobile },
        isIOS: { value: isIOS },
        isAndroid: { value: isAndroid },
        isFirefox: { value: isFirefox },
        isSauce: { value: isSauce },
        isSeleniumStandalone: { value: isSeleniumStandalone },
        isBidi: {
            /**
             * Return the value of this flag dynamically based on whether the
             * BidiHandler was able to connect to the `webSocketUrl` url provided
             * by the session response.
             */
            get: function (this: Client & { _bidiHandler?: BidiHandler }) {
                return Boolean(this._bidiHandler?.isConnected)
            }
        },
        isChromium: { value: isChromium },
        isWindowsApp: { value: isWindowsApp },
        isMacApp: { value: isMacApp }
    }
}

/**
 * Decorate the client's options object with host updates based on the presence of
 * directConnect capabilities in the new session response. Note that this
 * mutates the object.
 * @param  {Client} params post-new-session client
 */
export function setupDirectConnect(client: Client) {
    const capabilities = client.capabilities
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
 * get human-readable message from response error
 * @param {Error} err response error
 * @param params
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
 * Enhance the monad with WebDriver Bidi primitives if a connection can be established successfully
 * @param socketUrl url to bidi interface
 * @param strictSSL
 * @param userHeaders
 * @returns prototype with interface for bidi primitives
 */
export function initiateBidi (
    socketUrl: string,
    strictSSL: boolean = true,
    userHeaders?: Record<string, string>
): PropertyDescriptorMap {
    /**
     * don't connect and stale unit tests when the websocket url is set to a dummy value
     */
    const isUnitTesting = process.env.WDIO_UNIT_TESTS
    if (isUnitTesting) {
        log.info('Skip connecting to WebDriver Bidi interface due to unit tests')
        return {
            _bidiHandler: {
                value: {
                    isConnected: true,
                    waitForConnected: () => Promise.resolve(),
                    socket: { on: () => {}, off: () => {} }
                }
            }
        }
    }

    socketUrl = socketUrl.replace('localhost', '127.0.0.1')
    const bidiReqOpts: { rejectUnauthorized?: boolean, headers?: Record<string, string> } = strictSSL ? {} : { rejectUnauthorized: false }
    if (userHeaders) {
        bidiReqOpts.headers = userHeaders
    }
    const handler = new BidiHandler(socketUrl, bidiReqOpts)
    handler.connect().then((isConnected) => isConnected && log.info(`Connected to WebDriver Bidi interface at ${socketUrl}`))

    return {
        _bidiHandler: { value: handler },
        ...Object.values(WebDriverBidiProtocol).map((def) => def.socket).reduce((acc, cur) => {
            acc[cur.command] = {
                value: function (this: Client, ...args: unknown[]) {
                    const bidiFn = handler[cur.command] as Function | undefined

                    /**
                     * attach the client to the handler to emit events
                     */
                    handler.attachClient(this)

                    this.emit(cur.command, args)
                    return bidiFn?.apply(handler, args)
                }
            }
            return acc
        }, {} as PropertyDescriptorMap)
    }
}

export function parseBidiMessage (this: EventEmitter, data: Buffer) {
    try {
        const payload: Event = JSON.parse(data.toString())
        if (payload.type !== 'event') {
            return
        }

        this.emit(payload.method as string, payload.params)
    } catch (err) {
        log.error(`Failed parse WebDriver Bidi message: ${(err as Error).message}`)
    }
}

export const APPIUM_MASKING_HEADER = { 'x-appium-is-sensitive': 'true' }
/**
* Masking the text value, if the command has a text parameter, when the options mask is set to true.
* If nothing to mask, it returns the original body and args.
*/
export function mask(commandInfo: CommandEndpoint, options: CommandRuntimeOptions, body: Record<string, unknown>, args: unknown[]) {

    if (options.mask) {
        const textValueParamIndex = commandInfo.parameters.findIndex((param) => param.name === 'text')
        if (textValueParamIndex !== -1 ) {
            const textValueIndexInArgs = (commandInfo.variables?.length ?? 0) + textValueParamIndex
            const text = args[textValueIndexInArgs]
            if (text && typeof text === 'string') {
                const maskedBody = {
                    ...body,
                    text: SENSITIVE_DATA_REPLACER
                } satisfies Record<string, unknown> as Record<string, unknown>
                const textValueArgsIndex = textValueParamIndex + (commandInfo.variables?.length ?? 0)
                const maskedArgs = args.slice(0, textValueArgsIndex).concat(SENSITIVE_DATA_REPLACER).concat(args.slice(textValueArgsIndex + 1))
                return {
                    maskedBody: maskedBody,
                    maskedArgs: maskedArgs,
                    isMasked: true,
                }
            }
        }
    }
    return { maskedBody: body, maskedArgs: args, isMasked: false }
}