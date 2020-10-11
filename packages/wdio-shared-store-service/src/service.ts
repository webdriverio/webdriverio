import { readFile, getPidPath } from './utils'
import { getValue, setValue, setPort } from './client'

const globalAny:any = global

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
                value: (key: string) => globalAny.browser.call(() => getValue(key))
            },
            set: {
                value: (key: string, value: WebdriverIO.JsonCompatible | WebdriverIO.JsonPrimitive) => globalAny.browser.call(() => setValue(key, value))
            }
        })

        globalAny.browser.sharedStore = sharedStore
    }
}
