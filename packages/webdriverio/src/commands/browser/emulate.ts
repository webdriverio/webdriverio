type SupportedScopes = 'geolocation' | 'userAgent' | 'colorScheme' | 'onLine'

interface EmulationOptions {
    geolocation: Partial<GeolocationCoordinates>
    userAgent: string
    colorScheme: 'light' | 'dark'
    onLine: boolean
}

/**
 * WebdriverIO allows you to emulate Web APIs using the `emulate` command. These Web APIs can then
 * behave exactly as you specify it.
 *
 * Read more on this in the [Emulation](/docs/emulation) guidelines.
 *
 * :::info
 *
 * This feature requires WebDriver Bidi support for the browser. While recent versions of Chrome, Edge
 * and Firefox have such support, Safari __does not__. For updates follow [wpt.fyi](https://wpt.fyi/results/webdriver/tests/bidi/script/add_preload_script/add_preload_script.py?label=experimental&label=master&aligned).
 * Furthermore if you use a cloud vendor for spawning browsers, make sure your vendor also supports WebDriver Bidi.
 *
 * :::
 *
 * <example>
    :emulateColorScheme.js
    it('should open WebdriverIO using light color scheme', async () => {
        await browser.emulate('colorScheme', 'light')
        await browser.url('https://webdriver.io')
        const backgroundColor = await browser.$('nav').getCSSProperty('background-color')
        console.log(backgroundColor.parsed.hex) // outputs: "#efefef"
    })
    it('should open WebdriverIO using dark color scheme'm async () => {
        await browser.emulate('colorScheme', 'dark')
        await browser.url('https://webdriver.io')
        const backgroundColor = await browser.$('nav').getCSSProperty('background-color')
        console.log(backgroundColor.parsed.hex) // outputs: "#000000"
    })
 * </example>
 *
 * <example>
    :emulateGeoLocation.js
    it('should find my emulated geo location', async () => {
        await browser.emulate('geolocation', {
            latitude: 52.52,
            longitude: 13.39,
            accuracy: 100
        })
        await browser.url('https://www.google.com/maps')
        await browser.$('aria/Show Your Location').click()
        await browser.pause(5000)
        console.log(await browser.getUrl()) // outputs: "https://www.google.com/maps/@52.52,13.39,16z?entry=ttu"
    })
 * </example>
 *
 * @param {string} scope feature of the browser you like to emulate, can be either `geolocation`, `userAgent`, `colorScheme` or `onLine`
 * @param {EmulationOptions} options emulation option for specific scope
 * @returns `void`
 */
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
        await this.scriptAddPreloadScript({
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

        await this.scriptAddPreloadScript({
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

        await this.scriptAddPreloadScript({
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

        await this.scriptAddPreloadScript({
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
