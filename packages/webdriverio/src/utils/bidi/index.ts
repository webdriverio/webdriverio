import { ELEMENT_KEY, SHADOW_ELEMENT_KEY, type remote, type local } from 'webdriver'

import { EvaluateResultType, NonPrimitiveType, PrimitiveType, RemoteType } from './constants.js'
import { WebdriverBidiExeception } from './error.js'
import { createBidiFunctionDeclaration, createBlobFromSerializedValue, isSerializedBlobValue } from './serialize.js'
import { LocalValue } from './value.js'

/**
 * `execute` in an explicit browsing context. Element references in `args`
 * are only valid in the context they were found in, so use this when the
 * caller knows that context but only holds element ids.
 */
export async function executeInContext<ReturnValue> (
    browser: WebdriverIO.Browser,
    context: string,
    script: string | Function,
    ...args: unknown[]
): Promise<ReturnValue> {
    const params: remote.ScriptCallFunctionParameters = {
        functionDeclaration: createBidiFunctionDeclaration(script),
        awaitPromise: true,
        arguments: args.map((arg) => LocalValue.getArgument(arg)) as remote.ScriptLocalValue[],
        target: { context }
    }
    const result = await browser.scriptCallFunction(params)
    return parseScriptResult(params, result) as ReturnValue
}

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
    /**
     * a `NodeList` (`querySelectorAll`) and an `HTMLCollection` (`children`) hold
     * nodes, so they become a list of element references, as WebDriver Classic does
     */
    if (type === NonPrimitiveType.Array || type === RemoteType.NodeList || type === RemoteType.HTMLCollection) {
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
        const obj = Object.fromEntries((value || []).map(([key, value]: [string, remote.ScriptLocalValue]) => {
            return [typeof key === 'string' ? key : deserializeValue(key), deserializeValue(value)]
        }))
        if (isSerializedBlobValue(obj)) {
            return createBlobFromSerializedValue(obj)
        }
        return obj
    }
    if (type === RemoteType.Node) {
        return deserializeNode(result as unknown as remote.ScriptNodeRemoteValue)
    }
    if (type === RemoteType.Error) {
        return new Error('<unserializable error>')
    }
    return value
}

const ELEMENT_NODE = 1
const DOCUMENT_NODE = 9
const DOCUMENT_FRAGMENT_NODE = 11

/**
 * Turn a BiDi node into the value WebDriver Classic returns for it: an element
 * (or the document) becomes an element reference, a shadow root becomes a shadow
 * root reference and any other node (e.g. a text or comment node) is not an
 * element, so it is returned as a plain object of the node data BiDi sends.
 */
function deserializeNode (node: remote.ScriptNodeRemoteValue) {
    const props = node.value
    /**
     * the node data is optional in BiDi, without it we can't tell the
     * node type apart, so keep treating it as an element
     */
    if (!props || props.nodeType === ELEMENT_NODE || props.nodeType === DOCUMENT_NODE) {
        return { [ELEMENT_KEY]: node.sharedId as string }
    }
    /**
     * only a shadow root has a `mode`, other document fragments
     * (e.g. `template.content`) don't
     */
    if (props.nodeType === DOCUMENT_FRAGMENT_NODE && props.mode) {
        return { [SHADOW_ELEMENT_KEY]: node.sharedId as string }
    }
    return { ...props }
}
