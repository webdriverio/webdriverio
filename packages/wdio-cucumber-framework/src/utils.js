export function createStepArgument ({ argument }) {
    if (!argument) {
        return undefined
    }

    if (argument.type === 'DataTable') {
        return [{
            rows: argument.rows.map(row => (
                { cells: row.cells.map(cell => cell.value) }
            ))
        }]
    }

    if (argument.type === 'DocString') {
        return argument.content
    }

    return undefined
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
