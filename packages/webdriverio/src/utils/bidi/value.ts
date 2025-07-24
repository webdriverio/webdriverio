import { ELEMENT_KEY, type remote } from 'webdriver'
import type { ElementReference } from '@wdio/protocols'

import { PrimitiveType, NonPrimitiveType } from './constants.js'

const TYPE_CONSTANT = 'type'
const VALUE_CONSTANT = 'value'

/**
 * Represents the types of remote reference.
 */
enum RemoteReferenceType {
    Handle = 'handle',
    SharedId = 'sharedId'
}

type Serializeable = string | number | boolean | unknown
type LocalValueParam = Serializeable | (Serializeable)[] | [Serializeable, Serializeable][]

/**
 * Represents a local value with a specified type and optional value.
 * Described in https://w3c.github.io/webdriver-bidi/#type-script-LocalValue
 */
export class LocalValue {
    type: PrimitiveType | NonPrimitiveType
    value?: Serializeable | (Serializeable)[] | [Serializeable, Serializeable][]

    constructor(type: PrimitiveType | NonPrimitiveType, value?: LocalValueParam) {
        if (type === PrimitiveType.Undefined || type === PrimitiveType.Null) {
            this.type = type
        } else {
            this.type = type
            this.value = value
        }
    }

    /**
     * Creates a new LocalValue object with a string value.
     *
     * @param {string} value - The string value to be stored in the LocalValue object.
     * @returns {LocalValue} - The created LocalValue object.
     */
    static createStringValue(value: string) {
        return new LocalValue(PrimitiveType.String, value)
    }

    /**
     * Creates a new LocalValue object with a number value.
     *
     * @param {number} value - The number value.
     * @returns {LocalValue} - The created LocalValue object.
     */
    static createNumberValue(value: number) {
        return new LocalValue(PrimitiveType.Number, value)
    }

    /**
     * Creates a new LocalValue object with a special number value.
     *
     * @param {number} value - The value of the special number.
     * @returns {LocalValue} - The created LocalValue object.
     */
    static createSpecialNumberValue(value: number) {
        if (Number.isNaN(value)) {
            return new LocalValue(PrimitiveType.SpecialNumber, 'NaN')
        }
        if (Object.is(value, -0)) {
            return new LocalValue(PrimitiveType.SpecialNumber, '-0')
        }
        if (value === Infinity) {
            return new LocalValue(PrimitiveType.SpecialNumber, 'Infinity')
        }
        if (value === -Infinity) {
            return new LocalValue(PrimitiveType.SpecialNumber, '-Infinity')
        }
        return new LocalValue(PrimitiveType.SpecialNumber, value)
    }

    /**
     * Creates a new LocalValue object with an undefined value.
     * @returns {LocalValue} - The created LocalValue object.
     */
    static createUndefinedValue() {
        return new LocalValue(PrimitiveType.Undefined)
    }

    /**
     * Creates a new LocalValue object with a null value.
     * @returns {LocalValue} - The created LocalValue object.
     */
    static createNullValue() {
        return new LocalValue(PrimitiveType.Null)
    }

    /**
     * Creates a new LocalValue object with a boolean value.
     *
     * @param {boolean} value - The boolean value.
     * @returns {LocalValue} - The created LocalValue object.
     */
    static createBooleanValue(value: boolean) {
        return new LocalValue(PrimitiveType.Boolean, value)
    }

    /**
     * Creates a new LocalValue object with a BigInt value.
     *
     * @param {BigInt} value - The BigInt value.
     * @returns {LocalValue} - The created LocalValue object.
     */
    static createBigIntValue(value: bigint) {
        return new LocalValue(PrimitiveType.BigInt, value)
    }

    /**
     * Creates a new LocalValue object with an array.
     *
     * @param {Array} value - The array.
     * @returns {LocalValue} - The created LocalValue object.
     */
    static createArrayValue(value: Array<unknown>) {
        return new LocalValue(NonPrimitiveType.Array, value)
    }

    /**
     * Creates a new LocalValue object with date value.
     *
     * @param {string} value - The date.
     * @returns {LocalValue} - The created LocalValue object.
     */
    static createDateValue(value: Date) {
        return new LocalValue(NonPrimitiveType.Date, value)
    }

    /**
     * Creates a new LocalValue object of map value.
     * @param {Map} map - The map.
     * @returns {LocalValue} - The created LocalValue object.
     */
    static createMapValue(map: Map<unknown, unknown>) {
        const value: [Serializeable, Serializeable][] = []
        Object.entries(map).forEach((entry) => {
            value.push(entry)
        })
        return new LocalValue(NonPrimitiveType.Map, value)
    }

    /**
     * Creates a new LocalValue object from the passed object.
     *
     * @param {Object} map - The object.
     * @returns {LocalValue} - The created LocalValue object.
     */
    static createObjectValue(object: Record<string | number | symbol, unknown>) {
        const value: [Serializeable, Serializeable][] = []
        Object.entries(object).forEach(([key, val]) => {
            value.push([key, LocalValue.getArgument(val)])
        })
        return new LocalValue(NonPrimitiveType.Object, value)
    }

    /**
     * Creates a new LocalValue object of regular expression value.
     *
     * @param {string} value - The value of the regular expression.
     * @returns {LocalValue} - The created LocalValue object.
     */
    static createRegularExpressionValue(value: { pattern: string, flags: string }) {
        return new LocalValue(NonPrimitiveType.RegularExpression, value)
    }

    /**
     * Creates a new LocalValue object with the specified value.
     * @param {Set} value - The value to be set.
     * @returns {LocalValue} - The created LocalValue object.
     */
    static createSetValue(value: ([unknown, unknown] | ReferenceValue | LocalValue)[]) {
        return new LocalValue(NonPrimitiveType.Set, value)
    }

    /**
     * Creates a new LocalValue object with the given channel value
     *
     * @param {ChannelValue} value - The channel value.
     * @returns {LocalValue} - The created LocalValue object.
     */
    static createChannelValue(value: unknown) {
        return new LocalValue(NonPrimitiveType.Channel, value)
    }

    static createReferenceValue(handle: string, sharedId: string) {
        return new ReferenceValue(handle, sharedId)
    }

    static getArgument(argument: unknown) {
        const type = typeof argument
        switch (type) {
        case PrimitiveType.String:
            return LocalValue.createStringValue(argument as string)
        case PrimitiveType.Number:
            if (
                Number.isNaN(argument) ||
                Object.is(argument, -0) ||
                !Number.isFinite(argument)
            ) {
                return LocalValue.createSpecialNumberValue(argument as number)
            }

            return LocalValue.createNumberValue(argument as number)
        case PrimitiveType.Boolean:
            return LocalValue.createBooleanValue(argument as boolean)
        case PrimitiveType.BigInt:
            return LocalValue.createBigIntValue(argument as bigint)
        case PrimitiveType.Undefined:
            return LocalValue.createUndefinedValue()
        case NonPrimitiveType.Object:
            if (argument === null) {
                return LocalValue.createNullValue()
            }
            if (argument instanceof Date) {
                return LocalValue.createDateValue(argument)
            }
            if (argument instanceof Map) {
                const map: ([unknown, unknown] | LocalValue)[] = []

                argument.forEach((value, key) => {
                    const objectKey = typeof key === 'string'
                        ? key
                        : LocalValue.getArgument(key)
                    const objectValue = LocalValue.getArgument(value)
                    map.push([objectKey, objectValue])
                })
                return new LocalValue(NonPrimitiveType.Map, map)
            }
            if (argument instanceof Set) {
                const set: (ReferenceValue | LocalValue)[] = []
                argument.forEach((value) => {
                    set.push(LocalValue.getArgument(value))
                })
                return LocalValue.createSetValue(set)
            }
            if (argument instanceof Array) {
                const arr: (ReferenceValue | LocalValue)[] = []
                argument.forEach((value) => {
                    arr.push(LocalValue.getArgument(value))
                })
                return LocalValue.createArrayValue(arr)
            }
            if (argument instanceof RegExp) {
                return LocalValue.createRegularExpressionValue({
                    pattern: argument.source,
                    flags: argument.flags,
                })
            }
            if (argument && ELEMENT_KEY in (argument as ElementReference)) {
                return LocalValue.createReferenceValue(
                    RemoteReferenceType.SharedId,
                    (argument as ElementReference)[ELEMENT_KEY]
                )
            }

            return LocalValue.createObjectValue(argument as Record<string | number | symbol, unknown>)
        }

        throw new Error(`Unsupported type: ${type}`)
    }

    asMap() {
        return {
            [TYPE_CONSTANT]: this.type,
            ...(!(this.type === PrimitiveType.Null || this.type === PrimitiveType.Undefined)
                ? { [VALUE_CONSTANT]: this.value }
                : {})
        } as remote.ScriptLocalValue
    }
}

/**
 * Represents a reference value in the protocol.
 * Described in https://w3c.github.io/webdriver-bidi/#type-script-RemoteReference.
 */
class ReferenceValue {
    handle?: string
    sharedId?: string

    /**
     * Constructs a new ReferenceValue object.
     * @param {string} handle - The handle value.
     * @param {string} sharedId - The shared ID value.
     */
    constructor(handle: string, sharedId: string) {
        if (handle === RemoteReferenceType.Handle) {
            this.handle = sharedId
        } else if (handle === RemoteReferenceType.SharedId) {
            this.sharedId = sharedId
        } else {
            this.handle = handle
            this.sharedId = sharedId
        }
    }

    asMap() {
        const toReturn: { handle?: string, sharedId?: string } = {}
        if (typeof this.handle !== 'undefined') {
            toReturn[RemoteReferenceType.Handle] = this.handle
        }

        if (typeof this.sharedId !== 'undefined') {
            toReturn[RemoteReferenceType.SharedId] = this.sharedId
        }

        return toReturn
    }
}
