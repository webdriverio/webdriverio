import * as path from 'path'
import { isFunctionAsync } from '@wdio/utils'
import { CUCUMBER_HOOK_DEFINITION_TYPES } from './constants'

/**
 * NOTE: this function is exported for testing only
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
 * builds test parent string from feature and scenario names
 * NOTE: this function is exported for testing only
 * @param {object} feature cucumber feature object
 * @param {object} scenario cucumber scenario object
 */
export function getTestParent(feature, scenario) {
    return `${feature.name || 'Undefined Feature'}: ${scenario.name || 'Undefined Scenario'}`
}

/**
 * builds test title from step keyword and text
 * @param {object} step cucumber step object
 */
export function getTestStepTitle (keyword = '', text = '', type) {
    const title = (!text && type !== 'hook') ? 'Undefined Step' : text
    return `${keyword.trim()} ${title.trim()}`.trim()
}

/**
 * builds test full title from test parent and title
 * NOTE: this function is exported for testing only
 * @param {string} parent parent suite/scenario
 * @param {string} stepTitle step/test title
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
 * format message
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
 * Get step type
 * @param {string} type `Step` or `Hook`
 */
export function getStepType(type) {
    return type === 'Step' ? 'test' : 'hook'
}

/**
 * build payload for test/hook event
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
 * @param {object[]} result cucumber global result object
 */
export const getDataFromResult = ([{ uri }, feature, ...scenarios]) => ({ uri, feature, scenarios })

/**
 * wrap every user defined hook with function named `userHookFn`
 * to identify later on is function a step, user hook or wdio hook.
 * @param {object} options `Cucumber.supportCodeLibraryBuilder.options`
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
 * get test case steps
 * @param   {object}    feature                 cucumber's feature
 * @param   {object}    scenario                cucumber's scenario
 * @param   {object}    pickle                  cucumber's pickleEvent
 * @param   {object}    testCasePreparedEvent   cucumber's testCasePreparedEvent
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
            step = enhanceStepWithPickleData(step, pickle)
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
 * get resolved step text and argument for table steps, example:
 * Then User `<userId>` with `<password>` is logged in
 * Then User `someUser` with `Password12` is logged in
 * @param   {object}    origStep    cucumber's step
 * @param   {object}    pickle      cucumber's pickleEvent
 * @returns {string}
 */
export function enhanceStepWithPickleData (origStep, pickle) {
    const step = { ...origStep }
    const pickleStep = pickle.steps.find(s => s.locations.some(loc => loc.line === step.location.line))

    if (pickleStep) {
        step.text = pickleStep.text

        // replace variable with real value
        if (step.argument && step.argument.rows && Array.isArray(pickleStep.arguments)) {
            // build map like { line: { column: value } }
            const pickleStepValueLocation = {}

            // {
            //     arguments: [{
            //         rows: [{
            //             cells: [{
            //                 location: { ... },
            //                 value: "winter"
            //             }, {
            //                 location: { ... },
            //                 value: "cold"
            //             }]
            //         }]
            //     }]
            // }
            pickleStep.arguments.forEach(pStepArg => {
                pStepArg.rows.forEach(pStepRow => {
                    pStepRow.cells.forEach(pStepCell => {
                        if (!pickleStepValueLocation[pStepCell.location.line]) {
                            pickleStepValueLocation[pStepCell.location.line] = {}
                        }
                        pickleStepValueLocation[pStepCell.location.line][pStepCell.location.column] = pStepCell.value
                    })
                })
            })

            // {
            //     argument: {
            //         rows: [{
            //             cells: [{
            //                 location: { ... },
            //                 value: "<season>"
            //             }, {
            //                 location: { ... },
            //                 value: "<weather>"
            //             }]
            //         }]
            //     }
            // }
            step.argument.rows.forEach(stepRow => {
                stepRow.cells.forEach(stepCell => {
                    stepCell.value = pickleStepValueLocation[stepCell.location.line][stepCell.location.column]
                })
            })
        }
    }

    return step
}

/**
 * get an array of background and scenario steps
 * @param {object}      feature cucumber's feature
 * @param {object}      scenario cucumber's scenario
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
