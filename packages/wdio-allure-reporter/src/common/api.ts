import { events, stepStatuses } from '../constants.js'
import type { Status } from '../types.js'

/**
 * Call reporter
 * @param {string} event  - event name
 * @param {Object} msg - event payload
 * @private
 */
const tellReporter = (event: string, msg: any = {}) => {
    process.emit(event as any, msg)
}

/**
 * Assign feature to test
 * @name addFeature
 * @param {(string)} featureName - feature name or an array of names
 */
export function addFeature (featureName: string) {
    tellReporter(events.addFeature, { featureName })
}

/**
 * Assign label to test
 * @name addLabel
 * @param {string} name - label name
 * @param {string} value - label value
 */
export function addLabel (name: string, value: string) {
    tellReporter(events.addLabel, { name, value })
}
/**
 * Assign severity to test
 * @name addSeverity
 * @param {string} severity - severity value
 */
export function addSeverity (severity: string) {
    tellReporter(events.addSeverity, { severity })
}

/**
 * Assign issue id to test
 * @name addIssue
 * @param {string} issue - issue id value
 */
export function addIssue (issue: string) {
    tellReporter(events.addIssue, { issue })
}

/**
 * Assign TMS test id to test
 * @name addTestId
 * @param {string} testId - test id value
 */
export function addTestId (testId: string) {
    tellReporter(events.addTestId, { testId })
}

/**
 * Assign story to test
 * @name addStory
 * @param {string} storyName - story name for test
 */
export function addStory (storyName: string) {
    tellReporter(events.addStory, { storyName })
}

/**
 * Add environment value
 * @name addEnvironment
 * @param {string} name - environment name
 * @param {string} value - environment value
 */
export function addEnvironment (name: string, value: string) {
    tellReporter(events.addEnvironment, { name, value })
}

/**
 * Assign test description to test
 * @name addDescription
 * @param {string} description - description for test
 * @param {string} descriptionType - description type 'text'\'html'\'markdown'
 */
export function addDescription (description: string, descriptionType: string) {
    tellReporter(events.addDescription, { description, descriptionType })
}

/**
 * Add attachment
 * @name addAttachment
 * @param {string} name         - attachment file name
 * @param {*} content           - attachment content
 * @param {string=} mimeType    - attachment mime type
 */
export function addAttachment (name: string, content: string | Buffer | object, type: string) {
    if (!type) {
        type = content instanceof Buffer ? 'image/png' : typeof content === 'string' ? 'text/plain' : 'application/json'
    }
    tellReporter(events.addAttachment, { name, content, type })
}

/**
 * Start allure step
 * @name startStep
 * @param {string} title - step name in report
 */
export function startStep (title: string) {
    tellReporter(events.startStep, title)
}

/**
 * End current allure step
 * @name endStep
 * @param {StepStatus} [status='passed'] - step status
 */
export function endStep (status: Status = 'passed') {
    if (!Object.values(stepStatuses).includes(status)) {
        throw new Error(`Step status must be ${Object.values(stepStatuses).join(' or ')}. You tried to set "${status}"`)
    }
    tellReporter(events.endStep, status)
}

/**
 * Create allure step
 * @name addStep
 * @param {string} title - step name in report
 * @param {Object} [attachmentObject={}] - attachment for step
 * @param {string} attachmentObject.content - attachment content
 * @param {string} [attachmentObject.name='attachment'] - attachment name
 * @param {string} [attachmentObject.type='text/plain'] - attachment type
 * @param {string} [status='passed'] - step status
 */
export function addStep (
    title: string,
    {
        content,
        name = 'attachment',
        type = 'text/plain'
    }: any = {},
    status: Status = 'passed'
) {
    if (!Object.values(stepStatuses).includes(status)) {
        throw new Error(`Step status must be ${Object.values(stepStatuses).join(' or ')}. You tried to set "${status}"`)
    }

    const step = content ? { title, attachment: { content, name, type }, status } : { title, status }
    tellReporter(events.addStep, { step })
}

/**
 * Add additional argument to test
 * @name addArgument
 * @param {string} name - argument name
 * @param {string} value - argument value
 */
export function addArgument (name: string, value: string) {
    tellReporter(events.addArgument, { name, value })
}

export default {
    addFeature, addLabel, addSeverity, addIssue, addTestId, addStory, addEnvironment,
    addDescription, addAttachment, startStep, endStep, addStep, addArgument
}
