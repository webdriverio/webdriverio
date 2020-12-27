import * as path from 'path'
import { isFunctionAsync } from '@wdio/utils'
import { supportCodeLibraryBuilder } from '@cucumber/cucumber'
import { messages } from '@cucumber/messages'

import { CUCUMBER_HOOK_DEFINITION_TYPES } from './constants'
import { TestHookDefinitionConfig } from './types'

/**
 * NOTE: this function is exported for testing only
 */
export function createStepArgument ({ argument }: any) {
    if (!argument) {
        return undefined
    }

    if (argument.type === 'DataTable') {
        return {
            rows: argument.rows.map((row: any) => (
                {
                    cells: row.cells.map((cell: any) => cell.value),
                    locations: row.cells.map((cell: any) => cell.location)
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
export function getTestParent(feature: any, scenario: any) {
    return `${feature.name || 'Undefined Feature'}: ${scenario.name || 'Undefined Scenario'}`
}

/**
 * builds test title from step keyword and text
 * @param {object} step cucumber step object
 */
export function getTestStepTitle (keyword = '', text = '', type = '') {
    const title = (!text && type !== 'hook') ? 'Undefined Step' : text
    return `${keyword.trim()} ${title.trim()}`.trim()
}

/**
 * builds test full title from test parent and title
 * NOTE: this function is exported for testing only
 * @param {string} parent parent suite/scenario
 * @param {string} stepTitle step/test title
 */
export function getTestFullTitle(parent: any, stepTitle: any) {
    return `${parent}: ${stepTitle}`
}

/**
 * format message
 * @param {object} message { type: string, payload: object }
 */
export function formatMessage ({ payload = {} }: any) {
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
export function getStepType (step: messages.TestCase.ITestStep) {
    return step.hookId ? 'hook' : 'test'
}

export function getFeatureId (uri: string, feature: messages.GherkinDocument.IFeature) {
    return `${path.basename(uri)}:${feature.location?.line}:${feature.location?.column}`
}

/**
 * build payload for test/hook event
 */
export function buildStepPayload(
    uri: string,
    feature: messages.GherkinDocument.IFeature,
    scenario: messages.IPickle,
    step: messages.Pickle.IPickleStep,
    params: {
        type: string
        state?: messages.TestStepFinished.TestStepResult.Status | string | null
        error?: Error
        duration?: number
        title?: string | null
        passed?: boolean
        file?: string
    }
) {
    return {
        uid: step.id,
        title: step.text,
        parent: scenario.id,
        argument: createStepArgument(step),
        file: uri,
        tags: scenario.tags,
        // keyword: step.keyword,
        featureName: feature.name,
        scenarioName: scenario.name,
        ...params
    }
}

export function compareScenarioLineWithSourceLine(scenario: any, sourceLocation: any) {
    if (scenario.type.indexOf('ScenarioOutline') > -1) {
        return scenario.examples
            .some((example: any) => example.tableBody
                .some((tableEntry: any) => tableEntry.location.line === sourceLocation.line))
    }

    return scenario.location.line === sourceLocation.line
}

/**
 * @param {object[]} result cucumber global result object
 */
export const getDataFromResult = ([{ uri }, feature, ...scenarios]: any) => ({ uri, feature, scenarios })

/**
 * wrap every user defined hook with function named `userHookFn`
 * to identify later on is function a step, user hook or wdio hook.
 * @param {object} options `Cucumber.supportCodeLibraryBuilder.options`
 */
export function setUserHookNames (options: typeof supportCodeLibraryBuilder) {
    CUCUMBER_HOOK_DEFINITION_TYPES.forEach(hookName => {
        options[hookName].forEach((testRunHookDefinition: TestHookDefinitionConfig) => {
            const hookFn = testRunHookDefinition.code
            if (!hookFn.name.startsWith('wdioHook')) {
                const userHookAsyncFn = async function (this: any, ...args: any) {
                    return hookFn.apply(this, args)
                }
                const userHookFn = function (this: any, ...args: any) {
                    return hookFn.apply(this, args)
                }
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
export function getTestCaseSteps (feature: any, scenario: any, pickle: any, testCasePreparedEvent: any) {
    const allSteps = getAllSteps(feature, scenario)

    const steps = testCasePreparedEvent.steps.map((eventStep: any) => {
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
export function enhanceStepWithPickleData (origStep: any, pickle: any) {
    const step = { ...origStep }
    const pickleStep = pickle.steps.find((s: any) => s.locations.some((loc: any) => loc.line === step.location.line))

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
            pickleStep.arguments.forEach((pStepArg: any) => {
                pStepArg.rows.forEach((pStepRow: any) => {
                    pStepRow.cells.forEach((pStepCell: any) => {
                        // @ts-ignore
                        if (!pickleStepValueLocation[pStepCell.location.line]) {
                            // @ts-ignore
                            pickleStepValueLocation[pStepCell.location.line] = {}
                        }
                        // @ts-ignore
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
            step.argument.rows.forEach((stepRow: any) => {
                stepRow.cells.forEach((stepCell: any) => {
                    // @ts-ignore
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
export function getAllSteps (feature: any, scenario: any) {
    const allSteps = []
    const background = feature.children.find((child: any) => child.type === 'Background')
    if (background) {
        allSteps.push(...background.steps)
    }
    allSteps.push(...scenario.steps)
    return allSteps
}
