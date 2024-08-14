import { ELEMENT_KEY, type local, type remote } from 'webdriver'

import { EvaluateResultType, NonPrimitiveType, PrimitiveType, RemoteType } from './constants.js'

export function parseScriptResult(result: local.ScriptEvaluateResult) {
    const type = result.type

    if (type === EvaluateResultType.Success) {
        // @ts-expect-error
        return deserializeValue(result.result)
    }
    if (type === EvaluateResultType.Exception) {
        const columnNumber = 'columnNumber' in result.exceptionDetails ? result.exceptionDetails.columnNumber : null
        const exception = 'exception' in result.exceptionDetails ? result.exceptionDetails.exception : null
        const lineNumber = 'lineNumber' in result.exceptionDetails ? result.exceptionDetails.lineNumber : null
        const stackTrace = 'stackTrace' in result.exceptionDetails ? result.exceptionDetails.stackTrace : null
        const text = 'text' in result.exceptionDetails ? result.exceptionDetails.text : null
        return {
            error: {
                message: text,
                columnNumber,
                exception,
                lineNumber,
                stackTrace,
            }
        }
    }

    throw new Error(`Unknown evaluate result type: ${type}`)
}

export function deserializeValue(result: remote.ScriptLocalValue) {
    // @ts-expect-error
    const { type, value } = result
    if (value === NonPrimitiveType.Object) {
        return Object.fromEntries(value.map(([key, value]: [any, any]) => {
            return [deserializeValue(key), deserializeValue(value)]
        }))
    }
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
        return Object.fromEntries(value.map(([key, value]: [any, any]) => {
            return [typeof key === 'string' ? key : deserializeValue(key), deserializeValue(value)]
        }))
    }
    if (type === RemoteType.Node) {
        return { [ELEMENT_KEY]: (result as any).sharedId }
    }
    return value
}
