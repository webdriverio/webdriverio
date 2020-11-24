import { readFile, getPidPath } from './utils'
import { getValue, setValue, setPort } from './client'

interface ServiceOptions {}

export default class SharedStoreService {
    constructor (
        serviceOptions: ServiceOptions,
        caps: WebDriver.Capabilities[],
        config: WebdriverIO.Config,
        private _browser: WebdriverIO.BrowserObject | WebdriverIO.MultiRemoteBrowserObject
    ) {}

    async beforeSession () {
        /**
         * get port from parent's pid file saved in `onPrepare` hook
         */
        const port = await readFile(getPidPath(process.ppid))

        setPort(port.toString())
    }

    before () {
        const sharedStore = Object.create({}, {
            get: {
                value: (key: string) => this._browser.call(() => getValue(key))
            },
            set: {
                value: (key: string, value: WebdriverIO.JsonCompatible | WebdriverIO.JsonPrimitive) => this._browser.call(() => setValue(key, value))
            }
        })

        this._browser.sharedStore = sharedStore
    }
}
