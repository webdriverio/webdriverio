// object with no match
export interface ProtocolCommandResponse {
    [key: string]: any;
}

// webdriver.json
export interface SessionReturn extends ProtocolCommandResponse { }

export interface StatusReturn extends ProtocolCommandResponse {
    ready?: boolean,
    message?: string,
}

export type ElementReferenceId = 'element-6066-11e4-a52e-4f735466cecf'
export type ElementReference = Record<ElementReferenceId, string>

export interface WindowHandle {
    handle: string,
    type: string
}

export interface RectReturn {
    x: number,
    y: number,
    width: number,
    height: number
}

// appium protocol
export interface StringsReturn {
    [key: string]: string
}

export interface SettingsReturn extends ProtocolCommandResponse {
    shouldUseCompactResponses?: boolean,
    elementResponseAttributes?: string,
    ignoreUnimportantViews?: boolean,
    allowInvisibleElements?: boolean,
    enableNotificationListener?: boolean,
    actionAcknowledgmentTimeout?: number,
    keyInjectionDelay?: number,
    scrollAcknowledgmentTimeout?: number,
    waitForIdleTimeout?: number,
    waitForSelectorTimeout?: number,
    normalizeTagNames?: boolean,
    shutdownOnPowerDisconnect?: boolean,
    mjpegServerScreenshotQuality?: number,
    mjpegServerFramerate?: number,
    screenshotQuality?: number,
    mjpegScalingFactor?: number,
}

export interface Timeouts {
    implicit?: number,
    pageLoad?: number,
    script?: number
}

export type SameSiteOptions = 'Lax' | 'Strict' | 'None'
export interface Cookie {
    /**
     * The name of the cookie.
     */
    name: string;
    /**
     * The cookie value.
     */
    value: string;
    /**
     * The cookie path. Defaults to "/" if omitted when adding a cookie.
     */
    path?: string;
    /**
     * The domain the cookie is visible to. Defaults to the current browsing context’s
     * active document’s URL domain if omitted when adding a cookie.
     */
    domain?: string;
    /**
     * Whether the cookie is a secure cookie. Defaults to false if omitted when adding
     * a cookie.
     */
    secure?: boolean;
    /**
     * Whether the cookie is an HTTP only cookie. Defaults to false if omitted when
     * adding a cookie.
     */
    httpOnly?: boolean;
    /**
     * When the cookie expires, specified in seconds since Unix Epoch. Must not be set if
     * omitted when adding a cookie.
     */
    expiry?: number;
    /**
     * Whether the cookie applies to a SameSite policy. Defaults to None if omitted when
     * adding a cookie. Can be set to either "Lax" or "Strict".
     */
    sameSite?: SameSiteOptions
}

export type CommandPath = 'string'
export type CommandMethod = 'POST' | 'GET' | 'DELETE' | 'socket'
export type Protocol = Record<string, Partial<Record<CommandMethod, CommandEndpoint>>>

/**
 * describes a command endpoint
 */
export interface CommandEndpoint {
    /**
     * command name
     */
    command: string
    /**
     * command description
     */
    description?: string
    /**
     * link to specification reference
     */
    ref: string
    /**
     * supported command parameters
     */
    parameters: CommandParameters[]
    /**
     * variables within the command path (e.g. /:sessionId/element)
     */
    variables?: CommandPathVariables[]
    /**
     * supported environments
     */
    support?: SupportedEnvironments
    /**
     * set to true if command is only supported in Selenium Hub Node
     */
    isHubCommand?: boolean
    /**
     * information on return data
     */
    returns?: CommandReturnObject
    examples?: string[][]
}

export interface CommandReturnObject {
    type: string
    name: string
    description?: string
}

export interface CommandPathVariables {
    name: string
    description: string

    /**
     * the following are given for path variables, we should still define
     * it as values are populated automatically
     */
    required?: boolean
    type?: string
}

export interface CommandParameters {
    name: string,
    type: string,
    description: string,
    required?: boolean
}

export type Platform = 'ios' | 'android'
export type Environments = 'XCUITest' | 'UIAutomation' | 'UiAutomator'

/**
 * supported mobile environments, e.g.
 * ```
 * "ios": {
 *   "UIAutomation": "8.0 to 9.3"
 * }
 * ```
 */
export type SupportedEnvironments = Partial<Record<Platform, Partial<Record<Environments, string>>>>

export type SupportedMethods = (
    'session.status' |
    'session.new' |
    'session.subscribe' |
    'session.unsubscribe' |
    'browsingContext.captureScreenshot' |
    'browsingContext.close' |
    'browsingContext.create' |
    'browsingContext.getTree' |
    'browsingContext.handleUserPrompt' |
    'browsingContext.navigate' |
    'browsingContext.reload' |
    'browsingContext.contextCreated' |
    'browsingContext.contextDestroyed' |
    'browsingContext.navigationStarted' |
    'browsingContext.fragmentNavigated' |
    'browsingContext.domContentLoaded' |
    'browsingContext.load' |
    'browsingContext.downloadWillBegin' |
    'browsingContext.navigationAborted' |
    'browsingContext.navigationFailed' |
    'browsingContext.userPromptClosed' |
    'browsingContext.userPromptOpened' |
    'script.disown' |
    'script.callFunction' |
    'script.evaluate' |
    'script.getRealms' |
    'script.realmCreated' |
    'script.realmDestoyed' |
    'log.entryAdded'
)

export interface BidiRequest {
    method: SupportedMethods
    /**
     * types will be more defined later
     */
    params: Record<string, any>
}

export interface BidiResponse {
    id: number
}

export type Context = string | DetailedContext

/**
 * Extended Context when running tests in Appium
 */
export interface DetailedContext {
    id: string
    title?: string
    url?: string
    bundleId?: string
}
