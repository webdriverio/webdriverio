import { ELEMENT_KEY, type remote, type local } from 'webdriver'

import { EvaluateResultType, NonPrimitiveType, PrimitiveType, RemoteType } from './constants.js'
import { WebdriverBidiExeception } from './error.js'

export function parseScriptResult(params: remote.ScriptCallFunctionParameters, result: local.ScriptEvaluateResult) {
    const type = result.type

    if (type === EvaluateResultType.Success) {
        // @ts-expect-error
        return deserializeValue(result.result)
    }
    if (type === EvaluateResultType.Exception) {
        throw new WebdriverBidiExeception(params, result)
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
        return value.map((element: remote.ScriptLocalValue) => deserializeValue(element))
    }
    if (type === NonPrimitiveType.Date) {
        return new Date(value)
    }
    if (type === NonPrimitiveType.Map) {
        return new Map(value.map(([key, value]: [string, remote.ScriptLocalValue]) => (
            [typeof key === 'string' ? key : deserializeValue(key), deserializeValue(value)]
        )))
    }
    if (type === NonPrimitiveType.Set) {
        return new Set(value.map((element: remote.ScriptLocalValue) => deserializeValue(element)))
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
        return Object.fromEntries((value || []).map(([key, value]: [string, remote.ScriptLocalValue]) => {
            return [typeof key === 'string' ? key : deserializeValue(key), deserializeValue(value)]
        }))
    }
    if (type === RemoteType.Node) {
        return { [ELEMENT_KEY]: (result as { sharedId: string }).sharedId }
    }
    if (type === RemoteType.Error) {
        return new Error('<unserializable error>')
    }
    return value
}
