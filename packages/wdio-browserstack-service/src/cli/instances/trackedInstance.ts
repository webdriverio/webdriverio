import TrackedContext from './trackedContext.js'
import crypto from 'node:crypto'
import { threadId } from 'node:worker_threads'

export default class TrackedInstance {
    context: TrackedContext
    data: Map<string, any>

    static KEY_IS_BROWSERSTACK_AUTOMATION_SESSION = 'isBrowserstackAutomationSession'

    /**
   * create TrackedInstance
   * @param {TrackedContext} context
   */
    constructor(context: TrackedContext) {
        this.context = context
        this.data = new Map()
    }

    /**
   * get TrackedInstance ref
   * @returns {number} - returns ref id
   */
    getRef() {
        return this.context.getId()
    }

    /**
   * get TrackedInstance context
   * @return {TrackedContext} - returns tracked context
   */
    getContext() {
        return this.context
    }

    /**
   * get All data of Instance
   * @returns {Map} - returns all data
   */
    getAllData() {
        return this.data
    }

    /**
   * set multiple data in the instance
   * @param {*} key
   * @param {*} value
   */
    updateMultipleEntries(entries: Record<string, any>) {
        Object.keys(entries).forEach(key => {
            this.data.set(key, entries[key])
        })
    }

    updateData(key: string, value: any) {
        this.data.set(key, value)
    }

    /**
   * get Specific data of instance.
   * @param {*} key
   * @returns {*}
   */
    getData(key: string) {
        return this.data.get(key)
    }

    hasData(key: string): boolean {
        return this.data.has(key)
    }

    static createContext(target: string) {
        return new TrackedContext(
            crypto.createHash('sha256').update(target).digest('hex'),
            threadId || 0,
            process.pid,
            typeof(target)
        )
    }
}
