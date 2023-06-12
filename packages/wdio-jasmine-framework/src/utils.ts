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

export const jestResultToJasmine = (result: JestExpectationResult, isNot: boolean) => {
    if (result instanceof Promise) {
        return result.then(jestStyleResult => buildJasmineFromJestResult(jestStyleResult, isNot))
    }
    return buildJasmineFromJestResult(result, isNot)
}
