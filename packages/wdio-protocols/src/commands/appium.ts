import type {
    ProtocolCommandResponse,
    SettingsReturn,
    StringsReturn,
} from '../types'

// appium types
export default interface AppiumCommands {
    /**
     * Appium Protocol Command
     *
     * Perform a shake action on the device.
     * @ref http://appium.io/docs/en/commands/device/interactions/shake/
     *
     */
    shake(): void

    /**
     * Appium Protocol Command
     *
     * Lock the device.
     * @ref http://appium.io/docs/en/commands/device/interactions/lock/
     *
     */
    lock(seconds?: number): void

    /**
     * Appium Protocol Command
     *
     * Unlock the device.
     * @ref http://appium.io/docs/en/commands/device/interactions/unlock/
     *
     */
    unlock(): void

    /**
     * Appium Protocol Command
     *
     * Check whether the device is locked or not.
     * @ref http://appium.io/docs/en/commands/device/interactions/is-locked/
     *
     */
    isLocked(): boolean

    /**
     * Appium Protocol Command
     *
     * Start recording the screen.
     * @ref http://appium.io/docs/en/commands/device/recording-screen/start-recording-screen/
     *
     */
    startRecordingScreen(options?: object): void

    /**
     * Appium Protocol Command
     *
     * Stop recording screen
     * @ref http://appium.io/docs/en/commands/device/recording-screen/stop-recording-screen/
     *
     */
    stopRecordingScreen(
        remotePath?: string,
        username?: string,
        password?: string,
        method?: string,
    ): string

    /**
     * Appium Protocol Command
     *
     * Returns the information types of the system state which is supported to read as like cpu, memory, network traffic, and battery.
     * @ref http://appium.io/docs/en/commands/device/performance-data/performance-data-types/
     *
     */
    getPerformanceDataTypes(): string[]

    /**
     * Appium Protocol Command
     *
     * Returns the information of the system state which is supported to read as like cpu, memory, network traffic, and battery.
     * @ref http://appium.io/docs/en/commands/device/performance-data/get-performance-data/
     *
     */
    getPerformanceData(
        packageName: string,
        dataType: string,
        dataReadTimeout?: number,
    ): string[]

    /**
     * Appium Protocol Command
     *
     * Press a particular key on the device.
     * @ref http://appium.io/docs/en/commands/device/keys/press-keycode/
     *
     */
    pressKeyCode(keycode: number, metastate?: number, flags?: number): void

    /**
     * Appium Protocol Command
     *
     * Press and hold a particular key code on the device.
     * @ref http://appium.io/docs/en/commands/device/keys/long-press-keycode/
     *
     */
    longPressKeyCode(keycode: number, metastate?: number, flags?: number): void

    /**
     * Appium Protocol Command
     *
     * Send a key code to the device.
     * @ref https://github.com/appium/appium-base-driver/blob/master/docs/mjsonwp/protocol-methods.md#appium-extension-endpoints
     *
     */
    sendKeyEvent(keycode: string, metastate?: string): void

    /**
     * Appium Protocol Command
     *
     * Rotate the device in three dimensions.
     * @ref http://appium.io/docs/en/commands/device/interactions/rotate/
     *
     */
    rotateDevice(
        x: number,
        y: number,
        radius: number,
        rotation: number,
        touchCount: number,
        duration: number,
        element?: string,
    ): void

    /**
     * Appium Protocol Command
     *
     * Get the name of the current Android activity.
     * @ref http://appium.io/docs/en/commands/device/activity/current-activity/
     *
     */
    getCurrentActivity(): string

    /**
     * Appium Protocol Command
     *
     * Get the name of the current Android package.
     * @ref http://appium.io/docs/en/commands/device/activity/current-package/
     *
     */
    getCurrentPackage(): string

    /**
     * Appium Protocol Command
     *
     * Install the given app onto the device.
     * @ref http://appium.io/docs/en/commands/device/app/install-app/
     *
     */
    installApp(appPath: string): void

    /**
     * Appium Protocol Command
     *
     * Activate the given app onto the device
     * @ref http://appium.io/docs/en/commands/device/app/activate-app/
     *
     */
    activateApp(appId: string): void

    /**
     * Appium Protocol Command
     *
     * Remove an app from the device.
     * @ref http://appium.io/docs/en/commands/device/app/remove-app/
     *
     */
    removeApp(appId: string): void

    /**
     * Appium Protocol Command
     *
     * Terminate the given app on the device
     * @ref http://appium.io/docs/en/commands/device/app/terminate-app/
     *
     */
    terminateApp(appId: string): void

    /**
     * Appium Protocol Command
     *
     * Check whether the specified app is installed on the device.
     * @ref http://appium.io/docs/en/commands/device/app/is-app-installed/
     *
     */
    isAppInstalled(appId: string): boolean

    /**
     * Appium Protocol Command
     *
     * Get the given app status on the device
     * @ref http://appium.io/docs/en/commands/device/app/app-state/
     *
     */
    queryAppState(appId: string): number

    /**
     * Appium Protocol Command
     *
     * Hide soft keyboard.
     * @ref http://appium.io/docs/en/commands/device/keys/hide-keyboard/
     *
     */
    hideKeyboard(
        strategy?: string,
        key?: string,
        keyCode?: string,
        keyName?: string,
    ): void

    /**
     * Appium Protocol Command
     *
     * Whether or not the soft keyboard is shown.
     * @ref http://appium.io/docs/en/commands/device/keys/is-keyboard-shown/
     *
     */
    isKeyboardShown(): boolean

    /**
     * Appium Protocol Command
     *
     * Place a file onto the device in a particular place.
     * @ref http://appium.io/docs/en/commands/device/files/push-file/
     *
     */
    pushFile(path: string, data: string): void

    /**
     * Appium Protocol Command
     *
     * Retrieve a file from the device's file system.
     * @ref http://appium.io/docs/en/commands/device/files/pull-file/
     *
     */
    pullFile(path: string): string

    /**
     * Appium Protocol Command
     *
     * Retrieve a folder from the device's file system.
     * @ref http://appium.io/docs/en/commands/device/files/pull-folder/
     *
     */
    pullFolder(path: string): void

    /**
     * Appium Protocol Command
     *
     * Toggle airplane mode on device.
     * @ref http://appium.io/docs/en/commands/device/network/toggle-airplane-mode/
     *
     */
    toggleAirplaneMode(): void

    /**
     * Appium Protocol Command
     *
     * Switch the state of data service.
     * @ref http://appium.io/docs/en/commands/device/network/toggle-data/
     *
     */
    toggleData(): void

    /**
     * Appium Protocol Command
     *
     * Switch the state of the wifi service.
     * @ref http://appium.io/docs/en/commands/device/network/toggle-wifi/
     *
     */
    toggleWiFi(): void

    /**
     * Appium Protocol Command
     *
     * Switch the state of the location service.
     * @ref http://appium.io/docs/en/commands/device/network/toggle-location-services/
     *
     */
    toggleLocationServices(): void

    /**
     * Appium Protocol Command
     *
     * Set network speed (Emulator only)
     * @ref http://appium.io/docs/en/commands/device/network/network-speed/
     *
     */
    toggleNetworkSpeed(netspeed: string): void

    /**
     * Appium Protocol Command
     *
     * Open Android notifications (Emulator only).
     * @ref http://appium.io/docs/en/commands/device/system/open-notifications/
     *
     */
    openNotifications(): void

    /**
     * Appium Protocol Command
     *
     * Start an Android activity by providing package name and activity name.
     * @ref http://appium.io/docs/en/commands/device/activity/start-activity/
     *
     */
    startActivity(
        appPackage: string,
        appActivity: string,
        appWaitPackage?: string,
        appWaitActivity?: string,
        intentAction?: string,
        intentCategory?: string,
        intentFlags?: string,
        optionalIntentArguments?: string,
        dontStopAppOnReset?: string,
    ): void

    /**
     * Appium Protocol Command
     *
     * Retrieve visibility and bounds information of the status and navigation bars.
     * @ref http://appium.io/docs/en/commands/device/system/system-bars/
     *
     */
    getSystemBars(): object[]

    /**
     * Appium Protocol Command
     *
     * Get the time on the device.
     * @ref http://appium.io/docs/en/commands/device/system/system-time/
     *
     */
    getDeviceTime(): string

    /**
     * Appium Protocol Command
     *
     * Get display density from device.
     * @ref https://github.com/appium/appium-base-driver/blob/master/docs/mjsonwp/protocol-methods.md#appium-extension-endpoints
     *
     */
    getDisplayDensity(): any

    /**
     * Appium Protocol Command
     *
     * Simulate a [touch id](https://support.apple.com/en-ca/ht201371) event (iOS Simulator only). To enable this feature, the `allowTouchIdEnroll` desired capability must be set to true and the Simulator must be [enrolled](https://support.apple.com/en-ca/ht201371). When you set allowTouchIdEnroll to true, it will set the Simulator to be enrolled by default. The enrollment state can be [toggled](http://appium.io/docs/en/commands/device/simulator/toggle-touch-id-enrollment/index.html). This call will only work if Appium process or its parent application (e.g. Terminal.app or Appium.app) has access to Mac OS accessibility in System Preferences > Security & Privacy > Privacy > Accessibility list.
     * @ref http://appium.io/docs/en/commands/device/simulator/touch-id/
     *
     */
    touchId(match: boolean): void

    /**
     * Appium Protocol Command
     *
     * Toggle the simulator being [enrolled](https://support.apple.com/en-ca/ht201371) to accept touchId (iOS Simulator only). To enable this feature, the `allowTouchIdEnroll` desired capability must be set to true. When `allowTouchIdEnroll` is set to true the Simulator will be enrolled by default, and the 'Toggle Touch ID Enrollment' changes the enrollment state. This call will only work if the Appium process or its parent application (e.g., Terminal.app or Appium.app) has access to Mac OS accessibility in System Preferences > Security & Privacy > Privacy > Accessibility list.
     * @ref http://appium.io/docs/en/commands/device/simulator/toggle-touch-id-enrollment/
     *
     */
    toggleEnrollTouchId(enabled?: boolean): void

    /**
     * Appium Protocol Command
     *
     * Launch an app on device. iOS tests with XCUITest can also use the `mobile: launchApp` method. See detailed [documentation](http://appium.io/docs/en/writing-running-appium/ios/ios-xctest-mobile-apps-management/index.html#mobile-launchapp).
     * @ref http://appium.io/docs/en/commands/device/app/launch-app/
     *
     */
    launchApp(): void

    /**
     * Appium Protocol Command
     *
     * Close an app on device.
     * @ref http://appium.io/docs/en/commands/device/app/close-app/
     *
     */
    closeApp(): void

    /**
     * Appium Protocol Command
     *
     * Send the currently running app for this session to the background. iOS tests with XCUITest can also use the `mobile: terminateApp` method to terminate the current app (see detailed [documentation](http://appium.io/docs/en/writing-running-appium/ios/ios-xctest-mobile-apps-management/index.html#mobile-terminateapp)), and the `mobile: activateApp` to activate an existing application on the device under test and moves it to the foreground (see detailed [documentation](http://appium.io/docs/en/writing-running-appium/ios/ios-xctest-mobile-apps-management/index.html#mobile-activateapp)).
     * @ref http://appium.io/docs/en/commands/device/app/background-app/
     *
     */
    background(seconds: number | null): void

    /**
     * Appium Protocol Command
     *
     * Get test coverage data.
     * @ref http://appium.io/docs/en/commands/device/app/end-test-coverage/
     *
     */
    endCoverage(intent: string, path: string): void

    /**
     * Appium Protocol Command
     *
     * Get app strings.
     * @ref http://appium.io/docs/en/commands/device/app/get-app-strings/
     *
     */
    getStrings(language?: string, stringFile?: string): StringsReturn

    /**
     * Appium Protocol Command
     *
     * No description available, please see reference link.
     * @ref https://github.com/appium/appium-base-driver/blob/master/docs/mjsonwp/protocol-methods.md#appium-extension-endpoints
     *
     */
    setValueImmediate(elementId: string, value: string): void

    /**
     * Appium Protocol Command
     *
     * Replace the value to element directly.
     * @ref https://github.com/appium/appium-base-driver/blob/master/docs/mjsonwp/protocol-methods.md#appium-extension-endpoints
     *
     */
    replaceValue(elementId: string, value: string): void

    /**
     * Appium Protocol Command
     *
     * Retrieve the current settings on the device.
     * @ref http://appium.io/docs/en/commands/session/settings/get-settings/
     *
     */
    getSettings(): SettingsReturn

    /**
     * Appium Protocol Command
     *
     * Update the current setting on the device.
     * @ref http://appium.io/docs/en/commands/session/settings/update-settings/
     *
     */
    updateSettings(settings: object): void

    /**
     * Appium Protocol Command
     *
     * Callback url for asynchronous execution of JavaScript.
     * @ref https://github.com/appium/appium-base-driver/blob/master/docs/mjsonwp/protocol-methods.md#appium-extension-endpoints
     *
     */
    receiveAsyncResponse(response: object): void

    /**
     * Appium Protocol Command
     *
     * Make GSM call (Emulator only).
     * @ref http://appium.io/docs/en/commands/device/network/gsm-call/
     *
     */
    gsmCall(phoneNumber: string, action: string): void

    /**
     * Appium Protocol Command
     *
     * Set GSM signal strength (Emulator only).
     * @ref http://appium.io/docs/en/commands/device/network/gsm-signal/
     *
     */
    gsmSignal(signalStrength: string, signalStrengh?: string): void

    /**
     * Appium Protocol Command
     *
     * Set the battery percentage (Emulator only).
     * @ref http://appium.io/docs/en/commands/device/emulator/power_capacity/
     *
     */
    powerCapacity(percent: number): void

    /**
     * Appium Protocol Command
     *
     * Set the state of the battery charger to connected or not (Emulator only).
     * @ref http://appium.io/docs/en/commands/device/emulator/power_ac/
     *
     */
    powerAC(state: string): void

    /**
     * Appium Protocol Command
     *
     * Set GSM voice state (Emulator only).
     * @ref http://appium.io/docs/en/commands/device/network/gsm-voice/
     *
     */
    gsmVoice(state: string): void

    /**
     * Appium Protocol Command
     *
     * Simulate an SMS message (Emulator only).
     * @ref http://appium.io/docs/en/commands/device/network/send-sms/
     *
     */
    sendSms(phoneNumber: string, message: string): void

    /**
     * Appium Protocol Command
     *
     * Authenticate users by using their finger print scans on supported emulators.
     * @ref http://appium.io/docs/en/commands/device/authentication/finger-print/
     *
     */
    fingerPrint(fingerprintId: number): void

    /**
     * Appium Protocol Command
     *
     * Set the content of the system clipboard
     * @ref http://appium.io/docs/en/commands/device/clipboard/set-clipboard/
     *
     */
    setClipboard(content: string, contentType?: string, label?: string): string

    /**
     * Appium Protocol Command
     *
     * Get the content of the system clipboard
     * @ref http://appium.io/docs/en/commands/device/clipboard/get-clipboard/
     *
     */
    getClipboard(contentType?: string): string

    /**
     * Appium Protocol Command
     *
     * This functionality is only available from within a native context. 'Touch Perform' works similarly to the other singular touch interactions, except that this allows you to chain together more than one touch action as one command. This is useful because Appium commands are sent over the network and there's latency between commands. This latency can make certain touch interactions impossible because some interactions need to be performed in one sequence. Vertical, for example, requires pressing down, moving to a different y coordinate, and then releasing. For it to work, there can't be a delay between the interactions.
     * @ref http://appium.io/docs/en/commands/interactions/touch/touch-perform/
     *
     * @example
     * ```js
     * // do a horizontal swipe by percentage
     * const startPercentage = 10;
     * const endPercentage = 90;
     * const anchorPercentage = 50;
     *
     * const { width, height } = driver.getWindowSize();
     * const anchor = height// anchorPercentage / 100;
     * const startPoint = width// startPercentage / 100;
     * const endPoint = width// endPercentage / 100;
     * driver.touchPerform([
     *   {
     *     action: 'press',
     *     options: {
     *       x: startPoint,
     *       y: anchor,
     *     },
     *   },
     *   {
     *     action: 'wait',
     *     options: {
     *       ms: 100,
     *     },
     *   },
     *   {
     *     action: 'moveTo',
     *     options: {
     *       x: endPoint,
     *       y: anchor,
     *     },
     *   },
     *   {
     *     action: 'release',
     *     options: {},
     *   },
     * ]);
     * ```
     */
    touchPerform(actions: object[]): void

    /**
     * Appium Protocol Command
     *
     * This functionality is only available from within a native context. Perform a multi touch action sequence.
     * @ref http://appium.io/docs/en/commands/interactions/touch/multi-touch-perform/
     *
     */
    multiTouchPerform(actions: object[]): void

    /**
     * Appium Protocol Command
     *
     * This command allows you to define a webdriverio script in a string and send it to the Appium server to be executed locally to the server itself, thus reducing latency that might otherwise occur along with each command.
     * @ref https://github.com/appium/appium/blob/master/docs/en/commands/session/execute-driver.md
     *
     */
    driverScript(
        script: string,
        type?: string,
        timeout?: number,
    ): ProtocolCommandResponse

    /**
     * Appium Protocol Command
     *
     * Get events stored in appium server.
     * @ref https://github.com/appium/appium/blob/master/docs/en/commands/session/events/get-events.md
     *
     */
    getEvents(type: string[]): ProtocolCommandResponse

    /**
     * Appium Protocol Command
     *
     * Store a custom event.
     * @ref https://github.com/appium/appium/blob/master/docs/en/commands/session/events/log-event.md
     *
     */
    logEvent(vendor: string, event: string): void

    /**
     * Appium Protocol Command
     *
     * Performs images comparison using OpenCV framework features. It is expected that both OpenCV framework and opencv4nodejs module are installed on the machine where Appium server is running.
     * @ref http://appium.io/docs/en/writing-running-appium/image-comparison/
     *
     */
    compareImages(
        mode: string,
        firstImage: string,
        secondImage: string,
        options: object,
    ): ProtocolCommandResponse
}
