export const PACKAGE_NAME = '@wdio/mobilecli-driver'

/**
 * where `mobilecli server start` listens by default
 */
export const DEFAULT_PROTOCOL = 'http'
export const DEFAULT_HOSTNAME = 'localhost'
export const DEFAULT_PORT = 12000

/**
 * the server has one JSON-RPC endpoint
 */
export const RPC_ENDPOINT = 'rpc'

/**
 * How long one call to the server may take. The first call to a device can
 * be slow: the server installs and starts its agent on the device.
 */
export const DEFAULT_REQUEST_TIMEOUT = 120000

/**
 * how often a call is sent again after the server closed the connection
 * without an answer
 */
export const CLOSED_CONNECTION_RETRIES = 2

/**
 * The driver always is in the native app: it has no web views yet. They are
 * for a later slice, with `page.ts` of Mobilewright as the reference.
 */
export const NATIVE_CONTEXT = 'NATIVE_APP'

/**
 * the platform names of mobilecli and how WebdriverIO capabilities spell them
 */
export const PLATFORM_NAMES: Record<string, string> = {
    ios: 'iOS',
    android: 'Android'
}

/**
 * The selector strategies that the driver can match in the UI tree of
 * mobilecli. mobilecli has no element search of its own.
 */
export const SUPPORTED_STRATEGIES = ['accessibility id', 'id', 'class name'] as const

/**
 * What a user can change with the capability `mobilecli:options`, and what
 * it is without it. `MobilecliOptions` in `@wdio/types` says what every
 * setting does. `actionTimeout` and `pollInterval` are not here: without
 * them the driver uses `waitforTimeout` and `waitforInterval` of
 * WebdriverIO, see `getWaitOptions`.
 */
export const DEFAULT_SETTINGS = {
    /**
     * the time between two looks at the screen that have to show an element
     * at the same place, as in Mobilewright
     */
    stabilityDelay: 50,
    /**
     * how long a look at the screen counts as the first of these two
     */
    stabilityWindow: 1000,
    /**
     * How long a look at the screen is as good as a new one. WebdriverIO
     * finds an element and sends the command for it a few ms later: the
     * command then uses what the find saw.
     */
    screenFreshTime: 100,
    /**
     * How often a find may search the same selector in one look at the
     * screen. WebdriverIO searches a second time right after its wait found
     * the element. More often is a wait, which needs a new look every time.
     */
    maxSearchesPerScreen: 2,
    /**
     * how long the driver waits for a tapped element to get the focus
     * before it types with `device.io.text`
     */
    focusTimeout: 3000,
    /**
     * How long `device.io.keyboard.hide` may take: the first one in an app
     * can be slow, and the server gives the method 60 seconds.
     */
    keyboardTimeout: 60000,
    /**
     * How long the install of an app may take. The server gives up after 3
     * minutes, so that its error is the one the user sees.
     */
    installTimeout: 190000,
    /**
     * How long the driver waits until the app of `mobilecli:app` is in the
     * foreground after it was started, as in Mobilewright
     */
    appLaunchTimeout: 20000
}

/**
 * How long a command waits for its element and how long it waits between
 * two looks at the screen, if neither `mobilecli:options` nor WebdriverIO
 * (`waitforTimeout`, `waitforInterval`) says so. Both have these defaults
 * in WebdriverIO and in Mobilewright.
 */
export const DEFAULT_WAIT_TIMEOUT = 5000
export const DEFAULT_WAIT_INTERVAL = 100

export const INSTALL_HINT = 'Install mobilecli ("npm install -g mobilecli") and start the server with "mobilecli server start".'
