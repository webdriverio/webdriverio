const command = () => ({
    method: 'GET',
    endpoint: '/session/:sessionId/element',
    body: { using: 'css selector', value: 'img' },
    result: { value: { x: 75, y: 11, width: 160, height: 160 } },
    cid: '0-0',
    sessionId: '4d1707ae-820f-1645-8485-5a820b2a40da',
    capabilities: {}
} as any)
const devtoolsCommand = () => ({
    command: 'getTitle',
    params: {},
    retries: 0,
    result: { value: 'WebdriverJS Testpage' },
    sessionId: 'b1af7055-576c-4a77-b0a8-614c71b1e4ff',
    cid: '0-0'
} as any)
const screenShotCommand = () => ({
    method: 'GET',
    body: { using: 'css selector', value: 'img' },
    endpoint: '/session/:sessionId/screenshot',
    result: { value: 'base64' },
    cid: '0-0',
    sessionId: '4d1707ae-820f-1645-8485-5a820b2a40da',
    capabilities: {}
} as any)
const devtoolsScreenShotCommand = () => ({
    command: 'takeScreenshot',
    params: {},
    retries: 0,
    result: { value: 'WebdriverJS Testpage' },
    sessionId: 'b1af7055-576c-4a77-b0a8-614c71b1e4ff',
    cid: '0-0'
} as any)

export function commandStart(isDevtools?: boolean): WDIOReporter.Command {
    return isDevtools ? devtoolsCommand() : command()
}

export function commandEnd(isDevtools?: boolean) {
    return isDevtools ? devtoolsCommand() : command()
}

export function commandStartScreenShot(isDevtools?: boolean) {
    return isDevtools ? devtoolsScreenShotCommand() : screenShotCommand()
}

export function commandEndScreenShot(isDevtools?: boolean) {
    return isDevtools ? devtoolsScreenShotCommand() : screenShotCommand()
}
