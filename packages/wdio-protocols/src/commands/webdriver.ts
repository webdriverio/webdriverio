import type {
    Cookie,
    ElementReference,
    ProtocolCommandResponse,
    RectReturn,
    SessionReturn,
    StatusReturn,
    Timeouts,
    WindowHandle,
} from '../types'

// webdriver types
export default interface WebdriverCommands {
    /**
     * Webdriver Protocol Command
     *
     * The New Session command creates a new WebDriver session with the endpoint node. If the creation fails, a session not created error is returned.
     * @ref https://w3c.github.io/webdriver/#dfn-new-sessions
     *
     */
    newSession(capabilities: object): SessionReturn

    /**
     * Webdriver Protocol Command
     *
     * The Delete Session command closes any top-level browsing contexts associated with the current session, terminates the connection, and finally closes the current session.
     * @ref https://w3c.github.io/webdriver/#dfn-delete-session
     *
     */
    deleteSession(): void

    /**
     * Webdriver Protocol Command
     *
     * The Status command returns information about whether a remote end is in a state in which it can create new sessions and can additionally include arbitrary meta information that is specific to the implementation.
     * @ref https://w3c.github.io/webdriver/#dfn-status
     *
     */
    status(): StatusReturn

    /**
     * Webdriver Protocol Command
     *
     * The Get Timeouts command gets timeout durations associated with the current session.
     * @ref https://w3c.github.io/webdriver/#dfn-get-timeouts
     *
     */
    getTimeouts(): Timeouts

    /**
     * Webdriver Protocol Command
     *
     * The Set Timeouts command sets timeout durations associated with the current session. The timeouts that can be controlled are listed in the table of session timeouts below.
     * @ref https://w3c.github.io/webdriver/#dfn-set-timeouts
     *
     */
    setTimeouts(implicit?: number, pageLoad?: number, script?: number): void

    /**
     * Webdriver Protocol Command
     *
     * The Get Current URL command returns the URL of the current top-level browsing context.
     * @ref https://w3c.github.io/webdriver/#dfn-get-current-url
     *
     */
    getUrl(): string

    /**
     * Webdriver Protocol Command
     *
     * The navigateTo (go) command is used to cause the user agent to navigate the current top-level browsing context a new location.
     * @ref https://w3c.github.io/webdriver/#dfn-navigate-to
     *
     */
    navigateTo(url: string): string

    /**
     * Webdriver Protocol Command
     *
     * The Back command causes the browser to traverse one step backward in the joint session history of the current top-level browsing context. This is equivalent to pressing the back button in the browser chrome or calling `window.history.back`.
     * @ref https://w3c.github.io/webdriver/#dfn-back
     *
     */
    back(): void

    /**
     * Webdriver Protocol Command
     *
     * The Forward command causes the browser to traverse one step forwards in the joint session history of the current top-level browsing context.
     * @ref https://w3c.github.io/webdriver/#dfn-forward
     *
     */
    forward(): void

    /**
     * Webdriver Protocol Command
     *
     * The Refresh command causes the browser to reload the page in current top-level browsing context.
     * @ref https://w3c.github.io/webdriver/#dfn-refresh
     *
     */
    refresh(): void

    /**
     * Webdriver Protocol Command
     *
     * The Get Title command returns the document title of the current top-level browsing context, equivalent to calling `document.title`.
     * @ref https://w3c.github.io/webdriver/#dfn-get-title
     *
     */
    getTitle(): string

    /**
     * Webdriver Protocol Command
     *
     * The Get Window Handle command returns the window handle for the current top-level browsing context. It can be used as an argument to Switch To Window.
     * @ref https://w3c.github.io/webdriver/#dfn-get-window-handle
     *
     */
    getWindowHandle(): string

    /**
     * Webdriver Protocol Command
     *
     * The Close Window command closes the current top-level browsing context. Once done, if there are no more top-level browsing contexts open, the WebDriver session itself is closed.
     * @ref https://w3c.github.io/webdriver/#dfn-close-window
     *
     */
    closeWindow(): void

    /**
     * Webdriver Protocol Command
     *
     * The Switch To Window command is used to select the current top-level browsing context for the current session, i.e. the one that will be used for processing commands.
     * @ref https://w3c.github.io/webdriver/#dfn-switch-to-window
     *
     */
    switchToWindow(handle: string): void

    /**
     * Webdriver Protocol Command
     *
     * Create a new top-level browsing context.
     * @ref https://w3c.github.io/webdriver/#new-window
     *
     */
    createWindow(type: 'tab' | 'window'): WindowHandle

    /**
     * Webdriver Protocol Command
     *
     * The Get Window Handles command returns a list of window handles for every open top-level browsing context. The order in which the window handles are returned is arbitrary.
     * @ref https://w3c.github.io/webdriver/#dfn-get-window-handles
     *
     */
    getWindowHandles(): string[]

    /**
     * Webdriver Protocol Command
     *
     * The Print Page command renders the document to a paginated PDF document.
     * @ref https://w3c.github.io/webdriver/#print-page
     *
     */
    printPage(
        orientation?: string,
        scale?: number,
        background?: boolean,
        width?: number,
        height?: number,
        top?: number,
        bottom?: number,
        left?: number,
        right?: number,
        shrinkToFit?: boolean,
        pageRanges?: object[],
    ): string

    /**
     * Webdriver Protocol Command
     *
     * The Switch To Frame command is used to select the current top-level browsing context or a child browsing context of the current browsing context to use as the current browsing context for subsequent commands.
     * @ref https://w3c.github.io/webdriver/#dfn-switch-to-frame
     *
     */
    switchToFrame(id: number | object | null): void

    /**
     * Webdriver Protocol Command
     *
     * The Switch to Parent Frame command sets the current browsing context for future commands to the parent of the current browsing context.
     * @ref https://w3c.github.io/webdriver/#dfn-switch-to-parent-frame
     *
     */
    switchToParentFrame(): void

    /**
     * Webdriver Protocol Command
     *
     * The Get Window Rect command returns the size and position on the screen of the operating system window corresponding to the current top-level browsing context.
     * @ref https://w3c.github.io/webdriver/#dfn-get-window-rect
     *
     */
    getWindowRect(): RectReturn

    /**
     * Webdriver Protocol Command
     *
     * The Set Window Rect command alters the size and the position of the operating system window corresponding to the current top-level browsing context.
     * @ref https://w3c.github.io/webdriver/#dfn-set-window-rect
     *
     */
    setWindowRect(
        x: number | null,
        y: number | null,
        width: number | null,
        height: number | null,
    ): RectReturn

    /**
     * Webdriver Protocol Command
     *
     * The Maximize Window command invokes the window manager-specific "maximize" operation, if any, on the window containing the current top-level browsing context. This typically increases the window to the maximum available size without going full-screen.
     * @ref https://w3c.github.io/webdriver/#dfn-maximize-window
     *
     */
    maximizeWindow(): RectReturn

    /**
     * Webdriver Protocol Command
     *
     * The Minimize Window command invokes the window manager-specific "minimize" operation, if any, on the window containing the current top-level browsing context. This typically hides the window in the system tray.
     * @ref https://w3c.github.io/webdriver/#dfn-minimize-window
     *
     */
    minimizeWindow(): RectReturn

    /**
     * Webdriver Protocol Command
     *
     * The Fullscreen Window command invokes the window manager-specific “full screen” operation, if any, on the window containing the current top-level browsing context. This typically increases the window to the size of the physical display and can hide browser chrome elements such as toolbars.
     * @ref https://w3c.github.io/webdriver/#dfn-fullscreen-window
     *
     */
    fullscreenWindow(): RectReturn

    /**
     * Webdriver Protocol Command
     *
     * The Find Element command is used to find an element in the current browsing context that can be used for future commands. This command returns JSON representation of the element that can be passed to $ command to transform the reference to an extended WebdriverIO element.
     * @ref https://w3c.github.io/webdriver/#dfn-find-element
     *
     * @example
     * ```js
     * // get element
     * const elementRef = await browser.findElement('xpath', '//div')
     * const element = await $(elementRef)
     * await element.click()
     * ```
     */
    findElement(using: string, value: string): ElementReference

    /**
     * Webdriver Protocol Command
     *
     * The Find Element From Shadow Root command is used to find an element within the shadow root of an element that can be used for future commands. This command returns JSON representation of the element that can be passed to $ command to transform the reference to an extended WebdriverIO element.
     * @ref https://w3c.github.io/webdriver/#find-element-from-shadow-root
     *
     * @example
     * ```js
     * // get shadow root
     * const element = await browser.findElement('xpath', '//div')
     * const shadowRoot = await browser.getElementShadowRoot(
     *     element['element-6066-11e4-a52e-4f735466cecf']
     * )
     * // fetch element within that shadow root
     * const elementRef = await browser.findElementFromShadowRoot(
     *     shadowRoot['shadow-6066-11e4-a52e-4f735466cecf'],
     *     'xpath',
     *     '//div'
     * )
     * ```
     */
    findElementFromShadowRoot(
        shadowId: string,
        using: string,
        value: string,
    ): ProtocolCommandResponse

    /**
     * Webdriver Protocol Command
     *
     * The Find Elements command is used to find elements in the current browsing context that can be used for future commands. This command returns array of JSON representation of the elements that can be passed to $ command to transform the reference to an extended WebdriverIO element (See findElement).
     * @ref https://w3c.github.io/webdriver/#dfn-find-elements
     *
     */
    findElements(using: string, value: string): ElementReference[]

    /**
     * Webdriver Protocol Command
     *
     * The Find Elements command is used to find elements within the shadow root of an element that can be used for future commands. This command returns array of JSON representation of the elements that can be passed to $ command to transform the reference to an extended WebdriverIO element (See findElement).
     * @ref https://w3c.github.io/webdriver/#find-elements-from-shadow-root
     *
     * @example
     * ```js
     * // get shadow root
     * const element = await browser.findElement('xpath', '//div')
     * const shadowRoot = await browser.getElementShadowRoot(
     *     element['element-6066-11e4-a52e-4f735466cecf']
     * )
     * // fetch elements within that shadow root
     * const elementRef = await browser.findElementsFromShadowRoot(
     *     shadowRoot['shadow-6066-11e4-a52e-4f735466cecf'],
     *     'xpath',
     *     '//div'
     * )
     * ```
     */
    findElementsFromShadowRoot(
        shadowId: string,
        using: string,
        value: string,
    ): object[]

    /**
     * Webdriver Protocol Command
     *
     * The Find Element From Element command is used to find an element from a web element in the current browsing context that can be used for future commands. This command returns JSON representation of the element that can be passed to $ command to transform the reference to an extended WebdriverIO element (See findElement).
     * @ref https://w3c.github.io/webdriver/#dfn-find-element-from-element
     *
     */
    findElementFromElement(
        elementId: string,
        using: string,
        value: string,
    ): ElementReference

    /**
     * Webdriver Protocol Command
     *
     * The Find Elements From Element command is used to find elements from a web element in the current browsing context that can be used for future commands. This command returns array of JSON representation of the elements that can be passed to $ command to transform the reference to an extended WebdriverIO element (See findElement).
     * @ref https://w3c.github.io/webdriver/#dfn-find-elements-from-element
     *
     */
    findElementsFromElement(
        elementId: string,
        using: string,
        value: string,
    ): ElementReference[]

    /**
     * Webdriver Protocol Command
     *
     * Get the shadow root object of an element. The result object can be used to fetch elements within this shadow root using e.g. findElementFromShadowRoots or findElementsFromShadowRoots.
     * @ref https://w3c.github.io/webdriver/#dfn-get-active-element
     *
     */
    getElementShadowRoot(elementId: string): string

    /**
     * Webdriver Protocol Command
     *
     * Get Active Element returns the active element of the current browsing context’s document element. This command returns JSON representation of the element that can be passed to $ command to transform the reference to an extended WebdriverIO element (See findElement).
     * @ref https://w3c.github.io/webdriver/#dfn-get-active-element
     *
     */
    getActiveElement(): string

    /**
     * Webdriver Protocol Command
     *
     * Is Element Selected determines if the referenced element is selected or not. This operation only makes sense on input elements of the Checkbox- and Radio Button states, or option elements.
     * @ref https://w3c.github.io/webdriver/#dfn-is-element-selected
     *
     */
    isElementSelected(elementId: string): boolean

    /**
     * Webdriver Protocol Command
     *
     * Is Element Displayed determines the visibility of an element which is guided by what is perceptually visible to the human eye. In this context, an element's displayedness does not relate to the `visibility` or `display` style properties.
     * @ref https://w3c.github.io/webdriver/#element-displayedness
     *
     */
    isElementDisplayed(elementId: string): boolean

    /**
     * Webdriver Protocol Command
     *
     * The Get Element Attribute command will return the attribute of a web element.
     * @ref https://w3c.github.io/webdriver/#dfn-get-element-attribute
     *
     */
    getElementAttribute(elementId: string, name: string): string

    /**
     * Webdriver Protocol Command
     *
     * The Get Element Property command will return the result of getting a property of an element.
     * @ref https://w3c.github.io/webdriver/#dfn-get-element-property
     *
     */
    getElementProperty(elementId: string, name: string): string

    /**
     * Webdriver Protocol Command
     *
     * The Get Element CSS Value command retrieves the computed value of the given CSS property of the given web element.
     * @ref https://w3c.github.io/webdriver/#dfn-get-element-css-value
     *
     */
    getElementCSSValue(elementId: string, propertyName: string): string

    /**
     * Webdriver Protocol Command
     *
     * The Get Element Text command intends to return an element’s text "as rendered". An element's rendered text is also used for locating a elements by their link text and partial link text.
     * @ref https://w3c.github.io/webdriver/#dfn-get-element-text
     *
     */
    getElementText(elementId: string): string

    /**
     * Webdriver Protocol Command
     *
     * The Get Element Tag Name command returns the qualified element name of the given web element.
     * @ref https://w3c.github.io/webdriver/#dfn-get-element-tag-name
     *
     */
    getElementTagName(elementId: string): string

    /**
     * Webdriver Protocol Command
     *
     * The Get Element Rect command returns the dimensions and coordinates of the given web element.
     * @ref https://w3c.github.io/webdriver/#dfn-get-element-rect
     *
     */
    getElementRect(elementId: string): RectReturn

    /**
     * Webdriver Protocol Command
     *
     * Is Element Enabled determines if the referenced element is enabled or not. This operation only makes sense on form controls.
     * @ref https://w3c.github.io/webdriver/#dfn-is-element-enabled
     *
     */
    isElementEnabled(elementId: string): boolean

    /**
     * Webdriver Protocol Command
     *
     * The Element Click command scrolls into view the element if it is not already pointer-interactable, and clicks its in-view center point. If the element's center point is obscured by another element, an element click intercepted error is returned. If the element is outside the viewport, an element not interactable error is returned.
     * @ref https://w3c.github.io/webdriver/#dfn-element-click
     *
     */
    elementClick(elementId: string): void

    /**
     * Webdriver Protocol Command
     *
     * The Element Clear command scrolls into view an editable or resettable element and then attempts to clear its selected files or text content.
     * @ref https://w3c.github.io/webdriver/#dfn-element-clear
     *
     */
    elementClear(elementId: string): void

    /**
     * Webdriver Protocol Command
     *
     * The Element Send Keys command scrolls into view the form control element and then sends the provided keys to the element. In case the element is not keyboard-interactable, an element not interactable error is returned.<br /><br />The key input state used for input may be cleared mid-way through "typing" by sending the null key, which is U+E000 (NULL).
     * @ref https://w3c.github.io/webdriver/#dfn-element-send-keys
     *
     */
    elementSendKeys(elementId: string, text: string): void

    /**
     * Webdriver Protocol Command
     *
     * The Get Page Source command returns a string serialization of the DOM of the current browsing context active document.
     * @ref https://w3c.github.io/webdriver/#dfn-get-page-source
     *
     */
    getPageSource(): string

    /**
     * Webdriver Protocol Command
     *
     * The Execute Script command executes a JavaScript function in the context of the current browsing context and returns the return value of the function.
     * @ref https://w3c.github.io/webdriver/#dfn-execute-script
     *
     */
    executeScript(
        script: string,
        args: (string | object | number | boolean | undefined)[],
    ): any

    /**
     * Webdriver Protocol Command
     *
     * The Execute Async Script command causes JavaScript to execute as an anonymous function. Unlike the Execute Script command, the result of the function is ignored. Instead an additional argument is provided as the final argument to the function. This is a function that, when called, returns its first argument as the response.
     * @ref https://w3c.github.io/webdriver/#dfn-execute-async-script
     *
     */
    executeAsyncScript(
        script: string,
        args: (string | object | number | boolean | undefined)[],
    ): any

    /**
     * Webdriver Protocol Command
     *
     * The Get All Cookies command returns all cookies associated with the address of the current browsing context’s active document.
     * @ref https://w3c.github.io/webdriver/#dfn-get-all-cookies
     *
     */
    getAllCookies(): Cookie[]

    /**
     * Webdriver Protocol Command
     *
     * The Add Cookie command adds a single cookie to the cookie store associated with the active document's address.
     * @ref https://w3c.github.io/webdriver/#dfn-adding-a-cookie
     *
     */
    addCookie(cookie: object): void

    /**
     * Webdriver Protocol Command
     *
     * The Delete All Cookies command allows deletion of all cookies associated with the active document's address.
     * @ref https://w3c.github.io/webdriver/#dfn-delete-all-cookies
     *
     */
    deleteAllCookies(): void

    /**
     * Webdriver Protocol Command
     *
     * The Get Named Cookie command returns the cookie with the requested name from the associated cookies in the cookie store of the current browsing context's active document. If no cookie is found, a no such cookie error is returned.
     * @ref https://w3c.github.io/webdriver/#dfn-get-named-cookie
     *
     */
    getNamedCookie(name: string): Cookie

    /**
     * Webdriver Protocol Command
     *
     * The Delete Cookie command allows you to delete either a single cookie by parameter name, or all the cookies associated with the active document's address if name is undefined.
     * @ref https://w3c.github.io/webdriver/#dfn-delete-cookie
     *
     */
    deleteCookie(name: string): void

    /**
     * Webdriver Protocol Command
     *
     * The Perform Actions command is used to execute complex user actions. See [spec](https://github.com/jlipps/simple-wd-spec#perform-actions) for more details.
     * @ref https://w3c.github.io/webdriver/#dfn-perform-actions
     *
     */
    performActions(actions: object[]): void

    /**
     * Webdriver Protocol Command
     *
     * The Release Actions command is used to release all the keys and pointer buttons that are currently depressed. This causes events to be fired as if the state was released by an explicit series of actions. It also clears all the internal state of the virtual devices.
     * @ref https://w3c.github.io/webdriver/#dfn-release-actions
     *
     */
    releaseActions(): void

    /**
     * Webdriver Protocol Command
     *
     * The Dismiss Alert command dismisses a simple dialog if present, otherwise error. A request to dismiss an alert user prompt, which may not necessarily have a dismiss button, has the same effect as accepting it.
     * @ref https://w3c.github.io/webdriver/#dfn-dismiss-alert
     *
     */
    dismissAlert(): void

    /**
     * Webdriver Protocol Command
     *
     * The Accept Alert command accepts a simple dialog if present, otherwise error.
     * @ref https://w3c.github.io/webdriver/#dfn-accept-alert
     *
     */
    acceptAlert(): void

    /**
     * Webdriver Protocol Command
     *
     * The Get Alert Text command returns the message of the current user prompt. If there is no current user prompt, it returns an error.
     * @ref https://w3c.github.io/webdriver/#dfn-get-alert-text
     *
     */
    getAlertText(): string

    /**
     * Webdriver Protocol Command
     *
     * The Send Alert Text command sets the text field of a window.prompt user prompt to the given value.
     * @ref https://w3c.github.io/webdriver/#dfn-send-alert-text
     *
     */
    sendAlertText(text: string): void

    /**
     * Webdriver Protocol Command
     *
     * The Take Screenshot command takes a screenshot of the top-level browsing context's viewport.
     * @ref https://w3c.github.io/webdriver/#dfn-take-screenshot
     *
     */
    takeScreenshot(): string

    /**
     * Webdriver Protocol Command
     *
     * The Take Element Screenshot command takes a screenshot of the visible region encompassed by the bounding rectangle of an element.
     * @ref https://w3c.github.io/webdriver/#dfn-take-element-screenshot
     *
     */
    takeElementScreenshot(elementId: string, scroll?: boolean): string

    /**
     * Webdriver Protocol Command
     *
     * Get the computed WAI-ARIA role of an element.
     * @ref https://w3c.github.io/webdriver/#get-computed-role
     *
     */
    getElementComputedRole(elementId: string): string

    /**
     * Webdriver Protocol Command
     *
     * Get the accessible name of the element.
     * @ref https://w3c.github.io/webdriver/#get-computed-label
     *
     */
    getElementComputedLabel(elementId: string): string

    /**
     * Webdriver Protocol Command
     *
     * Simulates user modification of a PermissionDescriptor's permission state. __Note:__ this feature has not landed in all browsers yet.
     * @ref https://w3c.github.io/permissions/#set-permission-command
     *
     * @example
     * ```js
     * // set midi permissions
     * browser.setPermissions({
     *   name: 'midi',
     *   sysex; true
     * , 'granted'); // can be also 'denied' or 'prompt'
     * ```
     */
    setPermissions(descriptor: object, state: string, oneRealm?: boolean): void

    /**
     * Webdriver Protocol Command
     *
     * Generates a report for testing. Extension for [Reporting API](https://developers.google.com/web/updates/2018/09/reportingapi). __Note:__ this feature has not landed in all browsers yet.
     * @ref https://w3c.github.io/reporting/#automation
     *
     */
    generateTestReport(message: string, group: string): void

    /**
     * Webdriver Protocol Command
     *
     * Creates a mock sensor to emulate sensors like Ambient Light Sensor. __Note:__ this feature has not landed in all browsers yet.
     * @ref https://w3c.github.io/sensors/#create-mock-sensor-command
     *
     */
    createMockSensor(
        mockSensorType: string,
        maxSamplingFrequency: number,
        minSamplingFrequency: number,
    ): void

    /**
     * Webdriver Protocol Command
     *
     * Retrieves information about a given type of mock sensor. __Note:__ this feature has not landed in all browsers yet.
     * @ref https://w3c.github.io/sensors/#get-mock-sensor-command
     *
     */
    getMockSensor(type: string): ProtocolCommandResponse

    /**
     * Webdriver Protocol Command
     *
     * Updates the mock sensor type. __Note:__ this feature has not landed in all browsers yet.
     * @ref https://w3c.github.io/sensors/#update-mock-sensor-reading-command
     *
     */
    updateMockSensor(
        type: string,
        mockSensorType: string,
        maxSamplingFrequency: number,
        minSamplingFrequency: number,
    ): void

    /**
     * Webdriver Protocol Command
     *
     * The Delete Session command closes any top-level browsing contexts associated with the current session, terminates the connection, and finally closes the current session. __Note:__ this feature has not landed in all browsers yet.
     * @ref https://w3c.github.io/sensors/#delete-mock-sensor-command
     *
     */
    deleteMockSensor(type: string): void

    /**
     * Webdriver Protocol Command
     *
     * Simulates the changing of a time zone for the purposes of testing. __Note:__ this feature has not landed in all browsers yet.
     * @ref https://w3c.github.io/sensors/#create-mock-sensor-command
     *
     */
    setTimeZone(timeZone: string): void

    /**
     * Webdriver Protocol Command
     *
     * Creates a software [Virtual Authenticator](https://www.w3.org/TR/webauthn-2/#virtual-authenticators).
     * @ref https://www.w3.org/TR/webauthn-2/#sctn-automation-add-virtual-authenticator
     *
     */
    addVirtualAuthenticator(
        protocol?: string,
        transport?: string,
        hasResidentKey?: boolean,
        hasUserVerification?: boolean,
        isUserConsenting?: boolean,
        isUserVerified?: boolean,
        extensions?: string[],
        uvm?: object[],
    ): void

    /**
     * Webdriver Protocol Command
     *
     * Removes a previously created Virtual Authenticator.
     * @ref https://www.w3.org/TR/webauthn-2/#sctn-automation-remove-virtual-authenticator
     *
     */
    removeVirtualAuthenticator(authenticatorId: string): void

    /**
     * Webdriver Protocol Command
     *
     * Injects a Public Key Credential Source into an existing Virtual Authenticator.
     * @ref https://www.w3.org/TR/webauthn-2/#sctn-automation-add-credential
     *
     */
    addCredential(
        credentialId: string,
        isResidentCredential: boolean,
        rpId: string,
        privateKey: string,
        userHandle: string,
        signCount: number,
        largeBlob: string,
    ): void

    /**
     * Webdriver Protocol Command
     *
     * Returns one Credential Parameters object for every Public Key Credential Source stored in a Virtual Authenticator, regardless of whether they were stored using Add Credential or `navigator.credentials.create()`.
     * @ref https://www.w3.org/TR/webauthn-2/#sctn-automation-get-credentials
     *
     */
    getCredentials(authenticatorId: string): void

    /**
     * Webdriver Protocol Command
     *
     * Removes all Public Key Credential Sources stored on a Virtual Authenticator.
     * @ref https://www.w3.org/TR/webauthn-2/#sctn-automation-remove-all-credentials
     *
     */
    removeAllCredentials(authenticatorId: string): void

    /**
     * Webdriver Protocol Command
     *
     * Removes a Public Key Credential Source stored on a Virtual Authenticator.
     * @ref https://www.w3.org/TR/webauthn-2/#sctn-automation-remove-credential
     *
     */
    removeCredential(authenticatorId: string, credentialId: string): void

    /**
     * Webdriver Protocol Command
     *
     * The Set User Verified extension command sets the isUserVerified property on the Virtual Authenticator.
     * @ref https://www.w3.org/TR/webauthn-2/#sctn-automation-set-user-verified
     *
     */
    setUserVerified(authenticatorId: string, credentialId: string): void
}
