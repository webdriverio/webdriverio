import url from 'node:url'

interface JestExpectationResult {
    pass: boolean
    message: () => string
}

const buildJasmineFromJestResult = (result: JestExpectationResult, isNot: boolean) => {
    return {
        pass: result.pass !== isNot,
        message: result.message()
    }
}

export const jestResultToJasmine = (result: JestExpectationResult | Promise<JestExpectationResult>, isNot: boolean) => {
    if (result instanceof Promise) {
        return result.then(jestStyleResult => buildJasmineFromJestResult(jestStyleResult, isNot))
    }
    return buildJasmineFromJestResult(result, isNot)
}

// Jasmine does not support file:// URLs, and gives the file of an ESM spec as one
export const specPath = (spec: string) => spec.startsWith('file://') ? url.fileURLToPath(spec) : spec
