// object with no match
interface ProtocolCommandResponse {
    [key: string]: any;
}

// webdriver.json
interface SessionReturn extends DesiredCapabilities, ProtocolCommandResponse { }

interface StatusReturn extends ProtocolCommandResponse {
    ready?: boolean,
    message?: string,
}

interface WindowHandle {
    handle: string,
    type: string
}

interface RectReturn {
    x: number,
    y: number,
    width: number,
    height: number
}

// appium.json
interface StringsReturn {
    [key: string]: string
}

interface SettingsReturn extends ProtocolCommandResponse {
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

// generated typings
// ... insert here ...
