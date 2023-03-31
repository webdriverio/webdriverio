import type { StepBodyFunction } from 'allure-js-commons'
import { Status, AllureCommandStepExecutable } from 'allure-js-commons'
import { events } from '../constants.js'

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
 * Assign label to test
 * @name addLabel
 * @param {string} name - label name
 * @param {string} value - label value
 */
export function addLabel (name: string, value: string) {
    tellReporter(events.addLabel, { name, value })
}

/**
 * Assign link to test
 * @name addLink
 * @param {string} url - link name
 * @param {string} [name] - link name
 * @param {string} [type] - link type
 */
export function addLink(url: string, name?: string, type?: string) {
    tellReporter(events.addLink, { url, name, type })
}

/**
 * Assign allure id label to test to link test to existing entity inside the test ops
 * @name addAllureId
 * @param {string} id - inner allure test ops id
 */
export function addAllureId(id: string) {
    tellReporter(events.addAllureId, { id })
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
 * Assign story label to test
 * @name addStory
 * @param {string} storyName - story name for test
 */
export function addStory (storyName: string) {
    tellReporter(events.addStory, { storyName })
}

/**
 * Assign suite label to test
 * @name addSuite
 * @param {string} suiteName - story name for test
 */
export function addSuite(suiteName: string) {
    tellReporter(events.addSuite, { suiteName })
}

/**
 * Assign parent suite label to test
 * @name addParentSuite
 * @param {string} suiteName - suite name
 */
export function addParentSuite(suiteName: string) {
    tellReporter(events.addParentSuite, { suiteName })
}

/**
 * Assign sub-suite label to test
 * @name addSubSuite
 * @param {string} suiteName - sub-suite name
 */
export function addSubSuite(suiteName: string) {
    tellReporter(events.addSubSuite, { suiteName })
}

/**
 * Assign epic label to test
 * @name addEpic
 * @param {string} epicName - the epic name
 */
export function addEpic(epicName: string) {
    tellReporter(events.addEpic, { epicName })
}

/**
 * Assign owner label to test
 * @name addOwner
 * @param {string} owner - the owner name
 */
export function addOwner(owner: string) {
    tellReporter(events.addOwner, { owner })
}

/**
 * Assign tag label to test
 * @name addTag
 * @param {string} tag - the tag name
 */
export function addTag(tag: string) {
    tellReporter(events.addTag, { tag })
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
export function endStep (status: Status = Status.PASSED) {
    if (!Object.values(Status).includes(status)) {
        throw new Error(`Step status must be ${Object.values(Status).join(' or ')}. You tried to set "${status}"`)
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
    status: Status = Status.PASSED
) {
    if (!Object.values(Status).includes(status)) {
        throw new Error(`Step status must be ${Object.values(Status).join(' or ')}. You tried to set "${status}"`)
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

/**
 * Starts allure step execution with any content
 * Can be used to generate any hierarchy of steps
 * @param {string} name - the step name
 * @param {StepBodyFunction} body - the step content function
 */
export async function step(name: string, body: StepBodyFunction) {
    const runningStep = new AllureCommandStepExecutable(name)
    const result = await runningStep.start(body)

    tellReporter(events.addAllureStep, result)
}

export default {
    addFeature, addAllureId, addLabel, addSeverity, addIssue, addTestId, addStory, addEnvironment,
    addDescription, addAttachment, startStep, endStep, addStep, addArgument, step,
}
