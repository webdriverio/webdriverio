import * as path from 'path'

export function createStepArgument ({ argument }) {
    if (!argument) {
        return undefined
    }

    if (argument.type === 'DataTable') {
        return [{
            rows: argument.rows.map(row => (
                {
                    cells: row.cells.map(cell => cell.value),
                    locations: row.cells.map(cell => cell.location)
                }
            ))
        }]
    }

    if (argument.type === 'DocString') {
        return argument.content
    }

    return undefined
}

export function getUriOf (type) {
    if (!type || !type.uri) {
        return
    }

    return type.uri.replace(process.cwd(), '')
}

/**
 * builds test parent string from feature and scneario names
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
export function getTestStepTitle(step) {
    return ((step.keyword || '') + (step.text || 'Undefined Step')).trim()
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
export function formatMessage ({ type, payload = {} }) {
    let message = {
        ...payload,
        type: type
    }

    if (payload.error) {
        message.error = payload.error

        /**
         * hook failures are emitted as "test:fail"
         */
        if (payload.title && payload.title.match(/^"(before|after)( all)*" hook/g)) {
            message.type = 'hook:end'
        }
    }

    /**
     * Add the current test title to the payload for cases where it helps to
     * identify the test, e.g. when running inside a beforeEach hook
     */
    if (payload.ctx && payload.ctx.currentTest) {
        message.currentTest = payload.ctx.currentTest.title
    }

    if (type.match(/Test/)) {
        message.passed = (payload.state === 'passed')
    }

    if (payload.title && payload.parent) {
        payload.fullTitle = getTestFullTitle(payload.parent, payload.title)
    }

    return message
}

export function compareScenarioLineWithSourceLine (scenario, sourceLocation) {
    if (scenario.type.indexOf('ScenarioOutline') > -1) {
        return scenario.examples[0].tableBody
            .some((tableEntry) => tableEntry.location.line === sourceLocation.line)
    }

    return scenario.location.line === sourceLocation.line
}

export function getStepFromFeature (feature, pickle, stepIndex, sourceLocation) {
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
