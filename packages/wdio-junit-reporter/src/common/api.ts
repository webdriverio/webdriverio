
/** Events that may be send from workers to junit reporter */
export const events = {
    addProperty: 'junit:addProperty'
} as const

/**
 * Call reporter
 * @param {string} event  - event name
 * @param {object} msg - event payload
 * @private
 */
const tellReporter = (event: string, msg: any = {}) => {
    process.emit(event as any, msg)
}

/**
 * Add a junit property to the current running teststep
 * @name addLabel
 * @param {string} name - label name
 * @param {string} value - label value
 */
export function addProperty(name: string, value: string) {
    tellReporter(events.addProperty, { name, value })
}

export default {
    addProperty
}
