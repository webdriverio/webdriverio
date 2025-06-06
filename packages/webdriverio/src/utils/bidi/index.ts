import { ELEMENT_KEY, type remote, type local } from 'webdriver'

import { EvaluateResultType, NonPrimitiveType, PrimitiveType, RemoteType } from './constants.js'
import { WebdriverBidiExeception } from './error.js'

export function parseScriptResult(params: remote.ScriptCallFunctionParameters, result: local.ScriptEvaluateResult) {
    const type = result.type

    if (type === EvaluateResultType.Success) {
        return deserialize(result.result as remote.ScriptLocalValue)
    }
    if (type === EvaluateResultType.Exception) {
        throw new WebdriverBidiExeception(params, result)
    }

    throw new Error(`Unknown evaluate result type: ${type}`)
}

/**
 * Deserialize WebDriver Bidi result and clear up cache for internal objects
 * referenced in the result. This is necessary because WebDriver Bidi only
 * provides the actual value of a referenced object once and provides an internalId
 * to reference the object in subsequent calls. For example, given the following script:
 *
 * ```ts
 * await browser.execute(() => {
 *     const foobar = [1, 2, 3]
 *     const result= [
 *         {
 *             'id': 'foo',
 *             'properties': foobar
 *         },
 *         {
 *             'id': 'bar',
 *             'properties': foobar
 *         }
 *     ]
 *     return result
 * })
 * ```
 *
 * This will return the following result:
 *
 * ```json
 * {
 *   "id": 8,
 *   "result": {
 *     "realm": "9122925300023882510.7575046498635851678",
 *     "result": {
 *       "type": "array",
 *       "value": [
 *         {
 *           "type": "object",
 *           "value": [
 *             [
 *               "id",
 *               {
 *                 "type": "string",
 *                 "value": "__button1"
 *               }
 *             ],
 *             [
 *               "properties",
 *               {
 *                 "internalId": "8f3ed8d7-b8f7-4f8c-a958-49a94e85d18c",
 *                 "type": "array",
 *                 "value": [
 *                   {
 *                     "type": "number",
 *                     "value": 1
 *                   },
 *                   {
 *                     "type": "number",
 *                     "value": 2
 *                   },
 *                   {
 *                     "type": "number",
 *                     "value": 3
 *                   }
 *                 ]
 *               }
 *             ]
 *           ]
 *         },
 *         {
 *           "type": "object",
 *           "value": [
 *             [
 *               "id",
 *               {
 *                 "type": "string",
 *                 "value": "__button2"
 *               }
 *             ],
 *             [
 *               "properties",
 *               {
 *                 "internalId": "8f3ed8d7-b8f7-4f8c-a958-49a94e85d18c",
 *                 "type": "array"
 *               }
 *             ]
 *           ]
 *         }
 *       ]
 *     },
 *     "type": "success"
 *   },
 *   "type": "success"
 * }
 * ```
 *
 * This requires us to store the value behind the internalId in a cache and replace
 * the internalId with the actual value. However to avoid memory leaks, we need to
 * clear the cache after the result has been deserialized.
 *
 * @param result WebDriver Bidi result to deserialize
 * @returns      deserialized value
 */
const references = new Map<string, unknown>()
export function deserialize(result: remote.ScriptLocalValue) {
    const deserializedValue = deserializeValue(result)

    /**
     * clear cache after deserialization
     */
    references.clear()

    return deserializedValue
}

function deserializeValue(result: remote.ScriptLocalValue & { value?: unknown }) {
    /**
     * handle `internalId` references
     */
    if (result && 'internalId' in result && typeof result.internalId === 'string') {
        if ('value' in result) {
            /**
             * cache the reference if a value is provided
             */
            references.set(result.internalId, result.value)
        } else {
            /**
             * otherwise set the value from the cache
             */
            result.value = references.get(result.internalId)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { type, value } = result as any
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
