const command = () => ({
    method: 'GET',
    endpoint: '/session/:sessionId/element',
    body: { using: 'css selector', value: 'img' },
    result: { value: { x: 75, y: 11, width: 160, height: 160 } },
    cid: '0-0',
    sessionId: '4d1707ae-820f-1645-8485-5a820b2a40da',
    capabilities: {}
})
const screenShotCommand = () => ({
    method: 'GET',
    body: { using: 'css selector', value: 'img' },
    endpoint: '/session/:sessionId/screenshot',
    result: { value: 'base64' },
    cid: '0-0',
    sessionId: '4d1707ae-820f-1645-8485-5a820b2a40da',
    capabilities: {}
})

export function commandStart() {
    return command()
}

export function commandEnd() {
    return command()
}

export function commandStartScreenShot() {
    return screenShotCommand()
}

export function commandEndScreenShot() {
    return screenShotCommand()
}
