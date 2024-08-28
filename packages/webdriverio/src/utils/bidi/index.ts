import { ELEMENT_KEY, type remote, type local } from 'webdriver'

import { EvaluateResultType, NonPrimitiveType, PrimitiveType, RemoteType } from './constants.js'
import { SCRIPT_PREFIX, SCRIPT_SUFFIX } from '../../commands/constant.js'

export function parseScriptResult(params: remote.ScriptCallFunctionParameters, result: local.ScriptEvaluateResult) {
    const type = result.type

    if (type === EvaluateResultType.Success) {
        // @ts-expect-error
        return deserializeValue(result.result)
    }
    if (type === EvaluateResultType.Exception) {
        const text = 'text' in result.exceptionDetails ? result.exceptionDetails.text : null
        const error = new Error(text || 'Unknown error')

        /**
         * try to detect the line that caused the error and add it to the stack trace
         */
        const failureLine = getFailureLine(params.functionDeclaration, result.exceptionDetails)
        if (failureLine) {
            const stack: string[] = error.stack?.split('\n') || []
            const wrapCommandIndex = stack.findLastIndex((line) => line.includes('Context.executeAsync'))
            const executeLine = stack[wrapCommandIndex - 1]
            const [, row] = executeLine.replace('file://', '').split(':')
            const [errorMessage, ...restOfStack] = stack
            const linePrefix = `      ${row} │ `
            const codeLine = [
                linePrefix + failureLine,
                ' '.repeat(linePrefix.length - 2) + '╵ ' + '~'.repeat(failureLine.length),
                ''
            ]
            error.stack = [errorMessage, executeLine, ...codeLine, ...restOfStack].join('\n')
        }

        throw error
    }

    throw new Error(`Unknown evaluate result type: ${type}`)
}

export function deserializeValue(result: remote.ScriptLocalValue) {
    // @ts-expect-error
    const { type, value } = result
    if (type === NonPrimitiveType.RegularExpression) {
        return new RegExp(value.pattern, value.flags)
    }
    if (type === NonPrimitiveType.Array) {
        return value.map((element: any) => deserializeValue(element))
    }
    if (type === NonPrimitiveType.Date) {
        return new Date(value)
    }
    if (type === NonPrimitiveType.Map) {
        return new Map(value.map(([key, value]: [any, any]) => (
            [typeof key === 'string' ? key : deserializeValue(key), deserializeValue(value)]
        )))
    }
    if (type === NonPrimitiveType.Set) {
        return new Set(value.map((element: any) => deserializeValue(element)))
    }
    if (type === PrimitiveType.Number && value === 'NaN') {
        return NaN
    }
    if (type === PrimitiveType.Number && value === 'Infinity') {
        return Infinity
    }
    if (type === PrimitiveType.Number && value === '-Infinity') {
        return -Infinity
    }
    if (type === PrimitiveType.Number && value === '-0') {
        return -0
    }
    if (type === PrimitiveType.BigInt) {
        return BigInt(value)
    }
    if (type === PrimitiveType.Null) {
        return null
    }
    if (type === NonPrimitiveType.Object) {
        return Object.fromEntries((value || []).map(([key, value]: [any, any]) => {
            return [typeof key === 'string' ? key : deserializeValue(key), deserializeValue(value)]
        }))
    }
    if (type === RemoteType.Node) {
        return { [ELEMENT_KEY]: (result as any).sharedId }
    }
    if (type === RemoteType.Error) {
        return new Error('<unserializable error>')
    }
    return value
}

/**
 * This is an attempt to identify the snippet of code that caused an execute(Async) function to
 * throw an exception
 * @param {string} script       script that executed in the browser
 * @param {number} columnNumber column in which the scrpt threw an exception
 * @returns the line of failure in which the code threw an exception or `undefined` if we could not find it
 */
function getFailureLine (script: string, exceptionDetails: local.ScriptExceptionDetails) {
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
        const line = slicedScript.split('\n')[exceptionDetails.lineNumber - lineDiff].slice(exceptionDetails.columnNumber)
        return line
    }

    return undefined
}
