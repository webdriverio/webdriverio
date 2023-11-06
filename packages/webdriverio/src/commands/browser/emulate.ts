type SupportedScopes = 'geolocation' | 'userAgent' | 'colorScheme' | 'onLine'

interface EmulationOptions {
    geolocation: GeolocationPosition | Error
    userAgent: string
    colorScheme: 'light' | 'dark'
    onLine: boolean
}

export async function emulate<Scope extends SupportedScopes> (
    this: WebdriverIO.Browser,
    scope: Scope,
    options: EmulationOptions[Scope]
) {
    if (!this.isBidi) {
        throw new Error('emulate command is only supported for Bidi')
    }

    if (scope === 'geolocation') {
        if (!options) {
            throw new Error('Missing geolocation emulation options')
        }

        const patchedFn = options instanceof Error
            ? `cbError(new Error(${JSON.stringify(options.message)}))`
            : `cbSuccess({
                coords: ${JSON.stringify(options)},
                timestamp: Date.now()
            })`
        await this.scriptAddPreloadScriptCommand({
            functionDeclaration: /*js*/`() => {
                Object.defineProperty(navigator.geolocation, 'getCurrentPosition', {
                    value: (cbSuccess, cbError) => ${patchedFn}
                })
            }`
        })
        return
    }

    if (scope === 'userAgent') {
        if (typeof options !== 'string') {
            throw new Error(`Expected userAgent emulation options to be a string, received ${typeof options}`)
        }

        await this.scriptAddPreloadScriptCommand({
            functionDeclaration: /*js*/`() => {
                Object.defineProperty(navigator, 'userAgent', {
                    value: ${JSON.stringify(options)}
                })
            }`
        })
        return
    }

    if (scope === 'colorScheme') {
        if (options !== 'light' && options !== 'dark') {
            throw new Error(`Expected "colorScheme" emulation options to be either "light" or "dark", received "${options}"`)
        }

        await this.scriptAddPreloadScriptCommand({
            functionDeclaration: /*js*/`() => {
                const originalMatchMedia = window.matchMedia
                Object.defineProperty(window, 'matchMedia', {
                    value: (query) => {
                        const colorSchemeQuery = query.match(/\\(prefers-color-scheme:(\\s)*(dark|light)\\)/i)
                        if (colorSchemeQuery) {
                            const result = originalMatchMedia(query)
                            Object.defineProperty(result, 'matches', {
                                value: colorSchemeQuery[2] === "${options}",
                                configurable: true
                            })
                            return result
                        }

                        return originalMatchMedia(query)
                    },
                    configurable: true
                })
            }`
        })
        return
    }

    if (scope === 'onLine') {
        if (typeof options !== 'boolean') {
            throw new Error(`Expected "onLine" emulation options to be a boolean, received "${typeof options}"`)
        }

        await this.scriptAddPreloadScriptCommand({
            functionDeclaration: /*js*/`() => {
                Object.defineProperty(navigator, 'onLine', {
                    value: ${options}
                })
            }`
        })
        return
    }

    return
}
