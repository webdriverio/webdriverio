import * as path from 'path'
import { executeHooksWithArgs, runFnInFiberContext } from '@wdio/config'
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
 * builds test parent string from feature and scneario names
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
            target.examples[0].tableHeader.cells.forEach((header, idx) => {
                if (name.indexOf('<' + header.value + '>') === -1) {
                    return
                }

                target.examples[0].tableBody.forEach((tableEntry) => {
                    if (tableEntry.location.line === sourceLocation.line) {
                        name = name.replace('<' + header.value + '>', tableEntry.cells[idx].value)
                    }
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

export function getStepFromFeature(feature, pickle, stepIndex, sourceLocation) {
    let combinedSteps = []
    feature.children.forEach((child) => {
        if (child.type.indexOf('Scenario') > -1 && !compareScenarioLineWithSourceLine(child, sourceLocation)) {
            return
        }
        combinedSteps = combinedSteps.concat(child.steps)
    })
    const targetStep = combinedSteps[stepIndex]

    if (targetStep.type === 'Step') {
        const stepLine = targetStep.location.line
        const pickleStep = pickle.steps.find(s => s.locations.some(loc => loc.line === stepLine))

        if (pickleStep) {
            return { ...targetStep, text: pickleStep.text }
        }
    }

    return targetStep
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
 * returns a function that calls first before hook, then user step/hook and finally after hook (even if step has failed)
 * @param {string}      type    Step or Hook
 * @param {Function}    code    step function
 * @param {Function}    before  before hook function
 * @param {Function}    after   after hook function
 * @param {string}      cid     cid
 */
export function wrapWithHooks (type, code, before, after, cid) {
    const userFn = async function (...args) {
        const { uri, feature } = getDataFromResult(global.result)

        // before hook
        notifyStepHookError(`Before${type}`, await executeHooksWithArgs(before, [uri, feature]), cid)

        // step
        let result
        let error
        try {
            result = await runFnInFiberContext(code.bind(this, ...args))()
        } catch (err) {
            error = err
        }

        // after
        notifyStepHookError(`After${type}`, await executeHooksWithArgs(after, [uri, feature, { error, result }]), cid)

        if (error) {
            throw error
        }
        return result
    }
    return userFn
}

/**
 * notify `WDIOCLInterface` about failure in hook
 * we need to do it this way because `beforeStep` and `afterStep` are not real hooks.
 * Otherwise hooks failure are lost.
 * @param {string}  hookName    name of the hook
 * @param {Array}   hookResults hook functions results array
 * @param {string}  cid         cid
 */
export function notifyStepHookError (hookName, hookResults = [], cid) {
    const result = hookResults.find(result => result instanceof Error)
    if (typeof result === 'undefined') {
        return
    }
    const content = formatMessage({
        payload: {
            cid: cid,
            error: result,
            fullTitle: `${hookName} Hook`,
            type: 'hook',
            state: 'fail'
        }
    })
    process.send({
        origin: 'reporter',
        name: 'printFailureMessage',
        content
    })
}
