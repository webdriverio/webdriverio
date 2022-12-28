function indentAll(lines: string) {
    return lines.split('\n').map(x => '    ' + x).join('\n')
}

/**
 * An error that encapsulates more than one error, to support soft-assertions from Jasmine
 * even though Allure's API assumes one error-per test
 */
export default class CompoundError extends Error {
    public innerErrors: Error[]

    constructor(...innerErrors: Error[]) {
        const message = ['CompoundError: One or more errors occurred. ---\n'].
            concat(innerErrors.map(x => x.stack
                ? `${indentAll(x.stack)}\n--- End of stack trace ---\n`
                : `   ${x.message}\n--- End of error message ---\n`
            )).join('\n')

        super(message)
        this.innerErrors = innerErrors
    }
}
