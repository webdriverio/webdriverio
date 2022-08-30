export const paramTypeMap = {
    createWindow: [{
        name: 'type',
        type: "'tab' | 'window'"
    }]
}

export const returnTypeMap = {
    newSession: 'SessionReturn',
    status: 'StatusReturn',
    getTimeouts: 'Timeouts',
    createWindow: 'WindowHandle',
    getWindowRect: 'RectReturn',
    setWindowRect: 'RectReturn',
    maximizeWindow: 'RectReturn',
    minimizeWindow: 'RectReturn',
    fullscreenWindow: 'RectReturn',
    getElementRect: 'RectReturn',
    getNamedCookie: 'Cookie',
    getStrings: 'StringsReturn',
    getSettings: 'SettingsReturn',
    getWindowSize: 'RectReturn',
    findElement: 'ElementReference',
    findElements: 'ElementReference[]',
    findElementFromElement: 'ElementReference',
    findElementsFromElement: 'ElementReference[]',
    getAllCookies: 'Cookie[]',
    send: 'BidiResponse',
    getContext: 'Context',
    getContexts: 'Context[]'
}
