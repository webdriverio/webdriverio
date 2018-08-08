import {events, stepStatuses} from "./constants"
import {tellReporter} from "./utils"

/**
 * Assign feature to test
 * @param {(string)} featureName - feature name or an array of names
 */
export const addFeature = (featureName) => {
    tellReporter(events.addFeature, {featureName})
}

/**
 * Assign severity to test
 * @param {string} severity - severity value
 */
export const addSeverity = (severity) => {
    tellReporter(events.addSeverity, {severity})
}

/**
 * Assign story to test
 * @param {string} storyName - story name for test
 */
export const addStory = (storyName) => {
    tellReporter(events.addStory, {storyName})
}

/**
 * Add environment value
 * @param {string} name - environment name
 * @param {string} value - environment value
 */
export const addEnvironment = (name, value) => {
    tellReporter(events.addEnvironment, {name, value})
}

/**
 * Assign test description to test
 * @param {string} description - description for test
 * @param {string} type - description type 'text'\'html'\'markdown'
 */
export const addDescription = (description, type) => {
    tellReporter(events.addDescription, {description, type})
}

/**
 * Add attachment
 * @param {string} name - attachment file name
 * @param {string} content - attachment content
 * @param {string} [type='text/plain'] - attachment mime type
 */
export const addAttachment = (name, content, type = 'text/plain') => {
    tellReporter(events.addAttachment, {name, content, type})
}
/**
 * Create allure step
 * @param {string} title - step name in report
 * @param {Object} attachmentObject - attachment for step
 * @param {string} attachmentObject.content - attachment content
 * @param {string} [attachmentObject.name='attachment'] - attachment name
 * @param {string} [status='passed'] - step status
 */
export const addStep = (title, {content, name = 'attachment'}, status = stepStatuses.PASSED) => {
    if (!Object.values(stepStatuses).includes(status)) {
        throw new Error(`Step status must be ${Object.values(stepStatuses).join(' or ')}. You tried to set "${status}"`)
    }

    const step = {
        title,
        attachment: {
            content,
            name
        },
        status
    }
    tellReporter(events.addStep, {step})
}
