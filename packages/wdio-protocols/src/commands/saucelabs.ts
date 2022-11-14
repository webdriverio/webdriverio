import type { ProtocolCommandResponse } from '../types'

// saucelabs types
export default interface SaucelabsCommands {
    /**
     * Saucelabs Protocol Command
     *
     * Get webpage specific log information based on the last page load.
     * @ref https://wiki.saucelabs.com/display/DOCS/Custom+Sauce+Labs+WebDriver+Extensions+for+Network+and+Log+Commands#CustomSauceLabsWebDriverExtensionsforNetworkandLogCommands-ExtendedDebuggingTools
     *
     * @example
     * ```js
     * // Get Network Logs
     * console.log(browser.getPageLogs('sauce:network'));
     * //
     * // outputs:
     * // [{
     * //   "url": "https://app.saucelabs.com/dashboard",
     * //   "statusCode": 200,
     * //   "method": "GET",
     * //   "requestHeaders": {
     * //     ...
     * //   },
     * //   "responseHeaders": {
     * //     ...
     * //   },
     * //   "timing": {
     * //     ...
     * //   }
     * // }, {,
     * //   ...
     * // }]
     * //
     * ```*
     * @example
     * ```js
     * // Get Performance Logs (needs capturePerformance capability see: https://wiki.saucelabs.com/display/DOCS/Measure+Page+Load+Performance+Using+Test+Automation#MeasurePageLoadPerformanceUsingTestAutomation-EnableYourScript)
     * console.log(browser.getPageLogs('sauce:performance'));
     * //
     * // outputs:
     * // {
     * //   "speedIndex": 1472.023,
     * //   "timeToFirstInteractive": 1243.214,
     * //   "firstMeaningfulPaint": 892.643,
     * //   ...
     * // }
     * //
     * ```
     */
    getPageLogs(type: string): ProtocolCommandResponse

    /**
     * Saucelabs Protocol Command
     *
     * With network conditioning you can test your site on a variety of network connections, including Edge, 3G, and even offline. You can throttle the data throughput, including the maximum download and upload throughput, and use latency manipulation to enforce a minimum delay in connection round-trip time (RTT).
     * @ref https://wiki.saucelabs.com/display/DOCS/Custom+Sauce+Labs+WebDriver+Extensions+for+Network+and+Log+Commands#CustomSauceLabsWebDriverExtensionsforNetworkandLogCommands-ThrottleNetworkCapabilities
     *
     * @example
     * ```js
     * // predefined network condition
     * browser.throttleNetwork('offline')
     * ```*
     * @example
     * ```js
     * // custom network condition
     * browser.throttleNetwork({
     *   download: 1000,
     *   upload: 500,
     *   latency: 40'
     * })
     * ```
     */
    throttleNetwork(condition: string | object): void

    /**
     * Saucelabs Protocol Command
     *
     * You can throttle the CPU in DevTools to understand how your page performs under that constraint.
     * @ref https://wiki.saucelabs.com/display/DOCS/Custom+Sauce+Labs+WebDriver+Extensions+for+Network+and+Log+Commands#CustomSauceLabsWebDriverExtensionsforNetworkandLogCommands-ThrottleCPUCapabilities
     *
     * @example
     * ```js
     * // throttle CPU and make it run 4x slower
     * browser.throttleCPU(4)
     * ```*
     * @example
     * ```js
     * // reset CPU throttling
     * browser.throttleCPU(0)
     * ```
     */
    throttleCPU(rate: number): void

    /**
     * Saucelabs Protocol Command
     *
     * Allows modifying any request made by the browser. You can blacklist, modify, or redirect these as required for your tests.
     * @ref https://wiki.saucelabs.com/display/DOCS/Custom+Sauce+Labs+WebDriver+Extensions+for+Network+and+Log+Commands#CustomSauceLabsWebDriverExtensionsforNetworkandLogCommands-InterceptNetworkRequests
     *
     * @example
     * ```js
     * // redirect a request
     * browser.interceptRequest({
     *   url: 'https://saucelabs.com',
     *   redirect: 'https://google.com'
     * })
     * ```*
     * @example
     * ```js
     * // Blacklist requests to 3rd party vendors
     * browser.interceptRequest({
     *   url: 'https://api.segment.io/v1/p',
     *   error: 'Failed'
     * })
     * ```*
     * @example
     * ```js
     * // Modify requests to REST API (Mock REST API response)
     * browser.interceptRequest({
     *   url: 'http://sampleapp.appspot.com/api/todos',
     *   response: {
     *     headers: {
     *       'x-custom-headers': 'foobar'
     *     },
     *     body: [{
     *       title: 'My custom todo',
     *       order: 1,
     *       completed: false,
     *       url: 'http://todo-backend-express.herokuapp.com/15727'
     *     }]
     *   }
     * })
     * ```
     */
    interceptRequest(rule: object): void

    /**
     * Saucelabs Protocol Command
     *
     * Assert against the performance baseline of your app.
     * @ref https://wiki.saucelabs.com/display/DOCS/Custom+Sauce+Labs+WebDriver+Extensions+for+Network+and+Log+Commands
     *
     * @example
     * ```js
     * // test performance for a page
     * browser.url('https://webdriver.io')
     * const hasRegression = browser.assertPerformance({
     *   name: 'my performance test', // make sure that the name is also set in the sauce options in your capabilities
     *   metrics: ['score', 'firstPaint']
     * })
     * ```
     */
    assertPerformance(name: string, metrics?: string[]): ProtocolCommandResponse

    /**
     * Saucelabs Protocol Command
     *
     * Perform a scroll test that evaluates the jankiness of the application.
     * @ref https://wiki.saucelabs.com/display/DOCS/Custom+Sauce+Labs+WebDriver+Extensions+for+Network+and+Log+Commands
     *
     * @example
     * ```js
     * // test performance for a page
     * browser.url('https://webdriver.io')
     * browser.jankinessCheck()
     * ```
     */
    jankinessCheck(): ProtocolCommandResponse

    /**
     * Saucelabs Protocol Command
     *
     * Mocks a network resource.
     * @ref https://wiki.saucelabs.com/display/DOCS/Custom+Sauce+Labs+WebDriver+Extensions+for+Network+and+Log+Commands
     *
     */
    mockRequest(url: string, filterOptions?: object): ProtocolCommandResponse

    /**
     * Saucelabs Protocol Command
     *
     * Receive request information about requests that match the mocked resource.
     * @ref https://wiki.saucelabs.com/display/DOCS/Custom+Sauce+Labs+WebDriver+Extensions+for+Network+and+Log+Commands
     *
     */
    getMockCalls(mockId: string): ProtocolCommandResponse

    /**
     * Saucelabs Protocol Command
     *
     * Clear list of mock calls.
     * @ref https://wiki.saucelabs.com/display/DOCS/Custom+Sauce+Labs+WebDriver+Extensions+for+Network+and+Log+Commands
     *
     */
    clearMockCalls(mockId: string, restore?: boolean): void

    /**
     * Saucelabs Protocol Command
     *
     * Respond if mock matches a specific resource.
     * @ref https://wiki.saucelabs.com/display/DOCS/Custom+Sauce+Labs+WebDriver+Extensions+for+Network+and+Log+Commands
     *
     */
    respondMock(mockId: string, payload: object): void
}
