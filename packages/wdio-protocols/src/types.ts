// object with no match
export interface ProtocolCommandResponse {
    [key: string]: any;
}

// webdriver.json
export interface SessionReturn extends /* DesiredCapabilities, */ ProtocolCommandResponse { }

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

// appium.json
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

export type SameSiteOptions = 'Lax' | 'Strict'
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
