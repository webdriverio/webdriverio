export const paramTypeMap: Record<string, { name: string, type: string, requiresImport?: boolean }[]> = {
    createWindow: [{
        name: 'type',
        type: "'tab' | 'window'"
    }],
    deleteSession: [{
        name: 'deleteSessionOpts',
        type: 'DeleteSessionOpts',
        requiresImport: true
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
    findElementFromShadowRoot: 'ElementReference',
    findElementsFromShadowRoot: 'ElementReference[]',
    getElementShadowRoot: 'ShadowElementReference',
    getAllCookies: 'Cookie[]',
    send: 'BidiResponse',
    getContext: 'Context',
    getContexts: 'Context[]'
}
