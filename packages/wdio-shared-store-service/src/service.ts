import { readFile, getPidPath } from './utils'
import { getValue, setValue, setPort } from './client'

export default class SharedStoreService {
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
                value: (key: string) => global.browser.call(() => getValue(key))
            },
            set: {
                value: (key: string, value: WebdriverIO.JsonCompatible | WebdriverIO.JsonPrimitive) => global.browser.call(() => setValue(key, value))
            }
        })

        global.browser.sharedStore = sharedStore
    }
}
