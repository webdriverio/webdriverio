import { readFile, getPidPath } from './utils'
import { getValue, setValue, setPort } from './client'

export default class SharedStoreService implements WebdriverIO.HookFunctions {
    private _browser?: WebdriverIO.BrowserObject | WebdriverIO.MultiRemoteBrowserObject

    async beforeSession () {
        /**
         * get port from parent's pid file saved in `onPrepare` hook
         */
        const port = await readFile(getPidPath(process.ppid))

        setPort(port.toString())
    }

    before (
        caps: WebDriver.Capabilities,
        specs: string[],
        browser: WebdriverIO.BrowserObject | WebdriverIO.MultiRemoteBrowserObject
    ) {
        this._browser = browser
        const sharedStore = Object.create({}, {
            get: {
                value: (key: string) => this._browser?.call(() => getValue(key))
            },
            set: {
                value: (
                    key: string,
                    value: WebdriverIO.JsonCompatible | WebdriverIO.JsonPrimitive
                ) => this._browser?.call(() => setValue(key, value))
            }
        })

        this._browser.sharedStore = sharedStore
    }
}
