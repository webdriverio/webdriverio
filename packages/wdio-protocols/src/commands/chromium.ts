import type { ProtocolCommandResponse } from '../types'

// chromium types
export default interface ChromiumCommands {
    /**
     * Chromium Protocol Command
     *
     * Whether a simple dialog is currently open.
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/alert_commands.cc#L42-L49
     *
     * @example
     * ```js
     * console.log(browser.isAlertOpen()); // outputs: false
     * browser.execute('window.alert()');
     * console.log(browser.isAlertOpen()); // outputs: true
     * ```
     */
    isAlertOpen(): boolean

    /**
     * Chromium Protocol Command
     *
     * Whether it should automatically raises errors on browser logs.
     * @ref https://codereview.chromium.org/101203012
     *
     */
    isAutoReporting(): boolean

    /**
     * Chromium Protocol Command
     *
     * Toggle whether to return response with unknown error with first browser error (e.g. failed to load resource due to 403/404 response) for all subsequent commands (once enabled).
     * @ref https://codereview.chromium.org/101203012
     *
     * @example
     * ```js
     * // Enable auto reporting first thing after session was initiated with empty browser logs
     * console.log(browser.setAutoReporting(true)); // outputs: null
     * // Upon requesting an non-existing resource it will abort execution due to thrown unknown error
     * browser.url('https://webdriver.io/img/404-does-not-exist.png');
     * ```*
     * @example
     * ```js
     * // During the session do some operations which populate the browser logs
     * browser.url('https://webdriver.io/img/404-does-not-exist.png');
     * browser.url('https://webdriver.io/403/no-access');
     * // Enable auto reporting which throws an unknown error for first browser log (404 response)
     * browser.setAutoReporting(true);
     * ```
     */
    setAutoReporting(enabled: boolean): object | null

    /**
     * Chromium Protocol Command
     *
     * Determines load status for active window handle.
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/session_commands.cc#L783-L802
     *
     * @example
     * ```js
     * console.log(browser.isLoading()); // outputs: false
     * browser.newWindow('https://webdriver.io');
     * console.log(browser.isLoading()); // outputs: true
     * ```
     */
    isLoading(): boolean

    /**
     * Chromium Protocol Command
     *
     * Takes a heap snapshot of the current execution context.
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/chrome/web_view.h#L198-L202
     *
     */
    takeHeapSnapshot(): ProtocolCommandResponse

    /**
     * Chromium Protocol Command
     *
     * Get the connection type for network emulation. This command is only applicable when remote end replies with `networkConnectionEnabled` capability set to `true`.
     * @ref https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md#device-modes
     *
     * @example
     * ```js
     * const browser = remote({
     *     capabilities: {
     *         browserName: 'chrome',
     *         'goog:chromeOptions': {
     *             // Network emulation requires device mode, which is only enabled when mobile emulation is on
     *             mobileEmulation: { deviceName: 'iPad' },
     *         },
     *     }
     * });
     * console.log(browser.getNetworkConnection()); // outputs: 6 (Both Wi-Fi and data)
     * ```
     */
    getNetworkConnection(): number

    /**
     * Chromium Protocol Command
     *
     * Change connection type for network connection. This command is only applicable when remote end replies with `networkConnectionEnabled` capability set to `true`.
     * @ref https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md#device-modes
     *
     * @example
     * ```js
     * const browser = remote({
     *     capabilities: {
     *         browserName: 'chrome',
     *         'goog:chromeOptions': {
     *             // Network emulation requires device mode, which is only enabled when mobile emulation is on
     *             mobileEmulation: { deviceName: 'iPad' },
     *         },
     *     }
     * });
     * console.log(browser.setNetworkConnection({ type: 1 })); // outputs: 1 (Airplane Mode)
     * ```
     */
    setNetworkConnection(parameters: object): number

    /**
     * Chromium Protocol Command
     *
     * Get current network conditions used for emulation.
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/session_commands.cc#L839-L859
     *
     */
    getNetworkConditions(): ProtocolCommandResponse

    /**
     * Chromium Protocol Command
     *
     * Set network conditions used for emulation by throttling connection.
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/window_commands.cc#L1663-L1722
     *
     * @example
     * ```js
     * // Use different download (25kb/s) and upload (50kb/s) throughput values for throttling with a latency of 1000ms
     * browser.setNetworkConditions({ latency: 1000, download_throughput: 25600, upload_throughput: 51200 });
     * ```*
     * @example
     * ```js
     * // Force disconnected from network by setting 'offline' to true
     * browser.setNetworkConditions({ latency: 0, throughput: 0, offline: true });
     * ```*
     * @example
     * ```js
     * // When preset name (e.g. 'DSL') is specified it does not respect values in object (e.g. 'offline')
     * browser.setNetworkConditions({ latency: 0, throughput: 0, offline: true }, 'DSL');
     * ```*
     * @example
     * ```js
     * // Best practice for specifying network throttling preset is to use an empty object
     * browser.setNetworkConditions({}, 'Good 3G');
     * ```
     */
    setNetworkConditions(networkConditions: object, networkName?: string): void

    /**
     * Chromium Protocol Command
     *
     * Disable any network throttling which might have been set. Equivalent of setting the `No throttling` preset.
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/window_commands.cc#L1724-L1745
     *
     */
    deleteNetworkConditions(): void

    /**
     * Chromium Protocol Command
     *
     * Send a command to the DevTools debugger.<br />For a list of available commands and their parameters refer to the [Chrome DevTools Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/).
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/window_commands.cc#L1290-L1304
     *
     */
    sendCommand(cmd: string, params: object): void

    /**
     * Chromium Protocol Command
     *
     * Send a command to the DevTools debugger and wait for the result.<br />For a list of available commands and their parameters refer to the [Chrome DevTools Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/).
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/window_commands.cc#L1306-L1320
     *
     */
    sendCommandAndGetResult(cmd: string, params: object): any

    /**
     * Chromium Protocol Command
     *
     * Upload a file to remote machine on which the browser is running.
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/session_commands.cc#L1037-L1065
     *
     */
    file(file: string): string

    /**
     * Chromium Protocol Command
     *
     * Launches a Chrome app by specified id.
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/session_commands.cc#L521-L539
     *
     * @example
     * ```js
     * import fs from 'fs'
     * const browser = remote({
     *     capabilities: {
     *         browserName: 'chrome',
     *         'goog:chromeOptions': {
     *             // Install upon starting browser in order to launch it
     *             extensions: [
     *               // Entry should be a base64-encoded packed Chrome app (.crx)
     *               fs.readFileSync('/absolute/path/app.crx').toString('base64')
     *             ]
     *         }
     *     }
     * });
     * browser.launchChromeApp('aohghmighlieiainnegkcijnfilokake')); // Google Docs (https://chrome.google.com/webstore/detail/docs/aohghmighlieiainnegkcijnfilokake)
     * ```
     */
    launchChromeApp(id: string): void

    /**
     * Chromium Protocol Command
     *
     * Retrieves the value of a given form control element.
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/element_commands.cc#L431-L443
     *
     */
    getElementValue(elementId: string): string | null

    /**
     * Chromium Protocol Command
     *
     * Enable hover state for an element, which is reset upon next interaction.
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/element_commands.cc#L126-L146
     *
     */
    elementHover(elementId: string): void

    /**
     * Chromium Protocol Command
     *
     * Trigger a pinch zoom effect.
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/window_commands.cc#L813-L827
     *
     */
    touchPinch(x: number, y: number, scale: number): void

    /**
     * Chromium Protocol Command
     *
     * Freeze the current page. Extension for [Page Lifecycle API](https://developers.google.com/web/updates/2018/07/page-lifecycle-api).
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/window_commands.cc#L625-L633
     *
     */
    freeze(): void

    /**
     * Chromium Protocol Command
     *
     * Resume the current page. Extension for [Page Lifecycle API](https://developers.google.com/web/updates/2018/07/page-lifecycle-api).
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/window_commands.cc#L635-L645
     *
     */
    resume(): void

    /**
     * Chromium Protocol Command
     *
     * Returns the list of cast sinks (Cast devices) available to the Chrome media router.
     * @ref https://chromium.googlesource.com/chromium/src/+/refs/tags/73.0.3683.121/chrome/test/chromedriver/server/http_handler.cc#748
     *
     */
    getCastSinks(): string[]

    /**
     * Chromium Protocol Command
     *
     * Selects a cast sink (Cast device) as the recipient of media router intents (connect or play).
     * @ref https://chromium.googlesource.com/chromium/src/+/refs/tags/73.0.3683.121/chrome/test/chromedriver/server/http_handler.cc#737
     *
     */
    selectCastSink(sinkName: string): void

    /**
     * Chromium Protocol Command
     *
     * Initiates tab mirroring for the current browser tab on the specified device.
     * @ref https://chromium.googlesource.com/chromium/src/+/refs/tags/73.0.3683.121/chrome/test/chromedriver/server/http_handler.cc#741
     *
     */
    startCastTabMirroring(sinkName: string): void

    /**
     * Chromium Protocol Command
     *
     * Returns error message if there is any issue in a Cast session.
     * @ref https://chromium.googlesource.com/chromium/src/+/refs/tags/73.0.3683.121/chrome/test/chromedriver/server/http_handler.cc#751
     *
     */
    getCastIssueMessage(): string

    /**
     * Chromium Protocol Command
     *
     * Stops casting from media router to the specified device, if connected.
     * @ref https://chromium.googlesource.com/chromium/src/+/refs/tags/73.0.3683.121/chrome/test/chromedriver/server/http_handler.cc#744
     *
     */
    stopCasting(sinkName: string): void

    /**
     * Chromium Protocol Command
     *
     * Shutdown ChromeDriver process and consequently terminating all active sessions.
     * @ref https://github.com/bayandin/chromedriver/blob/v2.45/session_commands.cc#L489-L498
     *
     */
    shutdown(): void

    /**
     * Chromium Protocol Command
     *
     * The Take Element Screenshot command takes a screenshot of the visible region encompassed by the bounding rectangle of an element.
     * @ref https://w3c.github.io/webdriver/#dfn-take-element-screenshot
     *
     */
    takeElementScreenshot(elementId: string, scroll?: boolean): string

    /**
     * Chromium Protocol Command
     *
     * Get available log types.
     * @ref https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidlogtypes
     *
     */
    getLogTypes(): string[]

    /**
     * Chromium Protocol Command
     *
     * Get the log for a given log type. Log buffer is reset after each request.
     * @ref https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidlog
     *
     */
    getLogs(type: string): object[]
}
