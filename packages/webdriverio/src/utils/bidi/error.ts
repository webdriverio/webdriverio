import { type local, type remote } from 'webdriver'

import { SCRIPT_PREFIX, SCRIPT_SUFFIX } from '../../commands/constant.js'

export class WebdriverBidiExeception extends Error {
    #params: remote.ScriptCallFunctionParameters
    #result: local.ScriptEvaluateResultException

    constructor (
        params: remote.ScriptCallFunctionParameters,
        result: local.ScriptEvaluateResultException
    ) {
        super(result.exceptionDetails.text)
        this.name = 'WebdriverBidiExeception'
        this.#params = params
        this.#result = result
        this.stack = this.#getCustomStack()
    }

    #getCustomStack () {
        const origStack = this.stack

        /**
         * try to detect the line that caused the error and add it to the stack trace
         */
        const failureLine = this.#getFailureLine()
        const stack: string[] = origStack?.split('\n') || []
        const wrapCommandIndex = stack.findLastIndex((line) => line.includes('Context.executeAsync'))
        const executeLine = stack[wrapCommandIndex - 1] as string | undefined
        if (failureLine && executeLine) {
            const line = executeLine.replace('file://', '').split(':')
            const row = line.length > 3 ? line[2] : line[1]
            const [errorMessage, ...restOfStack] = stack
            const linePrefix = `      ${row} │ `
            const codeLine = [
                linePrefix + failureLine,
                ' '.repeat(linePrefix.length - 2) + '╵ ' + '~'.repeat(failureLine.length),
                ''
            ]
            return [errorMessage, executeLine, ...codeLine, ...restOfStack].join('\n')
        }
        return origStack
    }

    /**
     * This is an attempt to identify the snippet of code that caused an execute(Async) function to
     * throw an exception
     * @param {string} script       script that executed in the browser
     * @param {number} columnNumber column in which the scrpt threw an exception
     * @returns the line of failure in which the code threw an exception or `undefined` if we could not find it
     */
    #getFailureLine () {
        const script = this.#params.functionDeclaration
        const exceptionDetails =this.#result.exceptionDetails

        const userScript = script.split('\n').find((l) => l.includes(SCRIPT_PREFIX))
        if (!userScript) {
            return
        }

        let length = 0

        /**
         * Detect whether `tsx` minified the code
         */
        const isMinified = script.split('\n').some((line) => line.includes(SCRIPT_PREFIX) && line.includes(SCRIPT_SUFFIX))
        if (isMinified) {
            /**
             * If the user tests is a TypeScript file the code passed into execute is compiled via `tsx`
             * which uses Esbuild. It transforms whole function block into a single line separated by ";"
             * With this loop we identify the section that caused the error
             */
            for (const line of userScript.split(';')) {
                if ((length + line.length) >= exceptionDetails.columnNumber) {
                    return line.includes(SCRIPT_SUFFIX)
                        ? line.slice(0, line.indexOf(SCRIPT_SUFFIX))
                        : line
                }
                length += line.length
            }
        } else {
            const slicedScript = script.slice(
                script.indexOf(SCRIPT_PREFIX) + SCRIPT_PREFIX.length,
                script.indexOf(SCRIPT_SUFFIX)
            )
            const lineDiff = 9
            const line = slicedScript.split('\n')[exceptionDetails.lineNumber - lineDiff]?.slice(exceptionDetails.columnNumber)
            return line
        }

        return undefined
    }
}
