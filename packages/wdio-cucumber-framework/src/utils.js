import * as path from 'path'
import { isFunctionAsync } from '@wdio/utils'
import { CUCUMBER_HOOK_DEFINITION_TYPES } from './constants'

/**
 * (NOTE: This function is exported for testing only.)
 */
export function createStepArgument ({ argument }) {
    if (!argument) {
        return undefined
    }

    if (argument.type === 'DataTable') {
        return {
            rows: argument.rows.map(row => (
                {
                    cells: row.cells.map(cell => cell.value),
                    locations: row.cells.map(cell => cell.location)
                }
            ))
        }
    }

    if (argument.type === 'DocString') {
        return argument.content
    }

    return undefined
}

/**
 * Builds test parent string from feature and scenario names.
 * (NOTE: This function is exported for testing only.)
 * @param {object} feature - Cucumber feature object
 * @param {object} scenario - Cucumber scenario object
 */
export function getTestParent(feature, scenario) {
    return `${feature.name || 'Undefined Feature'}: ${scenario.name || 'Undefined Scenario'}`
}

/**
 * Builds test title from step keyword and text.
 * @param {object} step - Cucumber step object
 */
export function getTestStepTitle (keyword = '', text = '', type) {
    const title = (!text && type !== 'hook') ? 'Undefined Step' : text
    return `${keyword.trim()} ${title.trim()}`.trim()
}

/**
 * Builds test full title from test parent and title.
 * (NOTE: This function is exported for testing only.)
 * @param {string} parent - Parent suite/scenario
 * @param {string} stepTitle - Step/test title
 */
export function getTestFullTitle(parent, stepTitle) {
    return `${parent}: ${stepTitle}`
}

export function getUniqueIdentifier (target, sourceLocation) {
    if (target.type === 'Hook') {
        return `${path.basename(target.location.uri)}${target.location.line}`
    }

    if (target.type === 'ScenarioOutline') {
        let name = target.name || target.text
        const line = sourceLocation.line || ''

        if (Array.isArray(target.examples)) {
            target.examples.forEach((example) => {
                example.tableHeader.cells.forEach((header, idx) => {
                    if (name.indexOf('<' + header.value + '>') === -1) {
                        return
                    }

                    example.tableBody.forEach((tableEntry) => {
                        if (tableEntry.location.line === sourceLocation.line) {
                            name = name.replace('<' + header.value + '>', tableEntry.cells[idx].value)
                        }
                    })
                })
            })
        }

        return `${name}${line}`
    }

    const name = target.name || target.text
    const location = target.location || target.locations[0]
    const line = (location && location.line) || ''
    return `${name}${line}`
}

/**
 * Format message.
 * @param {object} message { type: string, payload: object }
 */
export function formatMessage ({ payload = {} }) {
    let content = { ...payload }

    /**
     * need to convert Error to plain object, otherwise it is lost on process.send
     */
    if (payload.error && (payload.error.message || payload.error.stack)) {
        const { name, message, stack } = payload.error
        content.error = { name, message, stack }
    }

    if (payload.title && payload.parent) {
        content.fullTitle = getTestFullTitle(payload.parent, payload.title)
    }

    return content
}

/**
 * Get step type.
 * @param {string} type - `Step` or `Hook`
 */
export function getStepType(type) {
    return type === 'Step' ? 'test' : 'hook'
}

/**
 * Build payload for test/hook event.
 */
export function buildStepPayload(uri, feature, scenario, step, params = {}) {
    return {
        uid: getUniqueIdentifier(step),
        title: getTestStepTitle(step.keyword, step.text, params.type),
        parent: getTestParent(feature, scenario),
        argument: createStepArgument(step),
        file: uri,
        tags: scenario.tags,
        keyword: step.keyword,
        featureName: feature.name,
        scenarioName: scenario.name,
        ...params
    }
}

export function compareScenarioLineWithSourceLine(scenario, sourceLocation) {
    if (scenario.type.indexOf('ScenarioOutline') > -1) {
        return scenario.examples
            .some(example => example.tableBody
                .some(tableEntry => tableEntry.location.line === sourceLocation.line))
    }

    return scenario.location.line === sourceLocation.line
}

/**
 * @param {object[]} result - Cucumber global result object.
 */
export const getDataFromResult = ([{ uri }, feature, ...scenarios]) => ({ uri, feature, scenarios })

/**
 * Wrap every user-defined hook with function named `userHookFn` to
 * later identify whether the function a step, user hook, or WDIO hook.
 * @param {object} options - `Cucumber.supportCodeLibraryBuilder.options`
 */
export function setUserHookNames (options) {
    CUCUMBER_HOOK_DEFINITION_TYPES.forEach(hookName => {
        options[hookName].forEach(testRunHookDefinition => {
            const hookFn = testRunHookDefinition.code
            if (!hookFn.name.startsWith('wdioHook')) {
                const userHookAsyncFn = async function (...args) { return hookFn.apply(this, args) }
                const userHookFn = function (...args) { return hookFn.apply(this, args) }
                testRunHookDefinition.code = (isFunctionAsync(hookFn)) ? userHookAsyncFn : userHookFn
            }
        })
    })
}

/**
 * Get test case steps.
 * @param   {object}    feature                - Cucumber's feature
 * @param   {object}    scenario               - Cucumber's scenario
 * @param   {object}    pickle                 - Cucumber's pickleEvent
 * @param   {object}    testCasePreparedEvent  - Cucumber's testCasePreparedEvent
 * @returns {object[]}
 */
export function getTestCaseSteps (feature, scenario, pickle, testCasePreparedEvent) {
    const allSteps = getAllSteps(feature, scenario)

    const steps = testCasePreparedEvent.steps.map(eventStep => {
        /**
         * find scenario step matching eventStep
         */
        let step = allSteps.find(scenarioStep => {
            const location = scenarioStep.location || {}

            // step
            if (eventStep.sourceLocation && eventStep.sourceLocation.uri === testCasePreparedEvent.sourceLocation.uri) {
                return typeof location.uri === 'undefined' && eventStep.sourceLocation.line === location.line
            }

            // hook
            return eventStep.actionLocation.uri === location.uri && eventStep.actionLocation.line === location.line
        })

        // set proper text for step
        if (step && eventStep.sourceLocation) {
            step = {
                ...step,
                text: getStepText(step, pickle)
            }
        }

        // if step was not found `eventStep` is a user defined hook
        return step ? step : {
            type: 'Hook',
            location: { ...eventStep.actionLocation },
            keyword: 'Hook',
            text: ''
        }
    })

    return steps
}

/**
 * Get resolved step text for table steps. 
 *
 * @example
 *  Then User `<userId>` with `<password>` is logged in
 *  Then User `someUser` with `Password12` is logged in
 *
 * @param   {object}    step   -    Cucumber's step
 * @param   {object}    pickle -    Cucumber's pickleEvent
 * @returns {string}
 */
export function getStepText (step, pickle) {
    const pickleStep = pickle.steps.find(s => s.locations.some(loc => loc.line === step.location.line))

    return pickleStep ? pickleStep.text : step.text
}

/**
 * Get an array of Background and Scenario steps.
 * @param {object}      feature  - Cucumber's feature
 * @param {object}      scenario - Cucumber's scenario
 * @returns {object[]}
 */
export function getAllSteps (feature, scenario) {
    const allSteps = []
    const background = feature.children.find((child) => child.type === 'Background')
    if (background) {
        allSteps.push(...background.steps)
    }
    allSteps.push(...scenario.steps)
    return allSteps
}
