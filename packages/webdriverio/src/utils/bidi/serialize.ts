/**
 * BiDi script results have no Blob type. `execute` runs the helper below in the
 * browser and turns Blob/File into a plain object. `deserialize` rebuilds a
 * Blob or File from that object.
 *
 * Graphs that do not contain a Blob or File are returned unchanged so BiDi can
 * keep shared references and cycles. A cycle inside a graph that does contain
 * one is replaced with `null`, because that graph has to be copied before BiDi
 * sees it.
 *
 * Blob, File, and FileList are detected by the brand they inherit, so a value
 * created in a same-origin iframe still transfers. An ordinary object that sets
 * the brand itself, or that carries its own fields, is left unchanged. The helper
 * is appended after the user
 * script so BiDi exception line numbers keep pointing at the user's code.
 *
 * This module does not import Node builtins. The browser runner loads it too.
 */

import { SCRIPT_PREFIX, SCRIPT_SUFFIX } from '../../commands/constant.js'

export const SERIALIZED_BLOB_KEY = '__wdioSerializedBlob__'
export const SERIALIZED_BLOB_KIND_BLOB = 'blob'
export const SERIALIZED_BLOB_KIND_FILE = 'file'

const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
const BLOB_TRANSFER_KEYS = new Set(['data', 'type', 'size', 'kind', SERIALIZED_BLOB_KEY])
const FILE_TRANSFER_KEYS = new Set([...BLOB_TRANSFER_KEYS, 'name', 'lastModified'])

type SerializedBlobKind = typeof SERIALIZED_BLOB_KIND_BLOB | typeof SERIALIZED_BLOB_KIND_FILE

export interface SerializedBlobValue {
    [SERIALIZED_BLOB_KEY]: true
    data: string
    type: string
    size: number
    kind: SerializedBlobKind
    name?: string
    lastModified?: number
}

/**
 * 24576 is a multiple of 3, so every chunk except the last encodes without
 * padding and the base64 pieces concatenate. It also stays under the
 * `Function#apply` argument limit used by older `btoa` recipes.
 */
const BASE64_CHUNK_SIZE = 0x6000

const SERIALIZER_HELPER = `
    const __wdioSerializedBlobKey = ${JSON.stringify(SERIALIZED_BLOB_KEY)};
    const __wdioSerializedBlobKindBlob = ${JSON.stringify(SERIALIZED_BLOB_KIND_BLOB)};
    const __wdioSerializedBlobKindFile = ${JSON.stringify(SERIALIZED_BLOB_KIND_FILE)};
    const __wdioCycle = Object.create(null);

    function __wdioTag(value) {
        return Object.prototype.toString.call(value);
    }

    function __wdioIsIndexKey(key) {
        return String(Number(key)) === key && Number.isInteger(Number(key)) && Number(key) >= 0;
    }

    function __wdioIsBlob(value) {
        const tag = __wdioTag(value);
        if (tag !== '[object Blob]' && tag !== '[object File]') {
            return false;
        }
        if (typeof value.arrayBuffer !== 'function' || typeof value.size !== 'number' || typeof value.type !== 'string') {
            return false;
        }
        // A real Blob/File, including one from another realm, inherits its brand
        // and has no own data properties. An object that sets the brand or
        // carries its own fields is user data.
        if (Object.prototype.hasOwnProperty.call(value, Symbol.toStringTag) || Object.keys(value).length !== 0) {
            return false;
        }
        return true;
    }

    function __wdioIsFileList(value) {
        if (__wdioTag(value) !== '[object FileList]' || typeof value.length !== 'number') {
            return false;
        }
        if (Object.prototype.hasOwnProperty.call(value, Symbol.toStringTag)) {
            return false;
        }
        return Object.keys(value).every((key) => key === 'length' || __wdioIsIndexKey(key));
    }

    function __wdioArrayBufferToBase64(buffer) {
        if (typeof btoa !== 'function') {
            throw new Error('Unable to encode Blob data: btoa is not available');
        }
        const bytes = new Uint8Array(buffer);
        const chunkSize = ${BASE64_CHUNK_SIZE};
        const parts = [];
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            const chunk = bytes.subarray(offset, offset + chunkSize);
            const binary = Array.from(chunk, (byte) => String.fromCharCode(byte)).join('');
            parts.push(btoa(binary));
        }
        return parts.join('');
    }

    async function __wdioSerializeBlob(blob) {
        const base64 = __wdioArrayBufferToBase64(await blob.arrayBuffer());
        const serialized = {
            [__wdioSerializedBlobKey]: true,
            data: base64,
            type: blob.type || '',
            size: blob.size,
            kind: __wdioSerializedBlobKindBlob
        };
        if (__wdioTag(blob) === '[object File]') {
            serialized.kind = __wdioSerializedBlobKindFile;
            serialized.name = blob.name;
            serialized.lastModified = blob.lastModified;
        }
        return serialized;
    }

    function __wdioIsHostValue(value) {
        if (typeof Node !== 'undefined' && value instanceof Node) {
            return true;
        }
        if (typeof Window !== 'undefined' && value instanceof Window) {
            return true;
        }
        if (value instanceof Date || value instanceof RegExp) {
            return true;
        }
        if (typeof ArrayBuffer !== 'undefined' && (value instanceof ArrayBuffer || ArrayBuffer.isView(value))) {
            return true;
        }
        if (typeof Error !== 'undefined' && value instanceof Error) {
            return true;
        }
        if (typeof Promise !== 'undefined' && value instanceof Promise) {
            return true;
        }
        return false;
    }

    async function __wdioSerializeEntries(entries, seen) {
        let changed = false;
        const copy = [];
        for (const entry of entries) {
            const next = await __wdioSerializeValue(entry, seen);
            if (next === __wdioCycle) {
                copy.push(null);
                continue;
            }
            if (next !== entry) {
                changed = true;
            }
            copy.push(next);
        }
        return { changed, copy };
    }

    async function __wdioSerializeValue(value, seen) {
        if (value === null || typeof value !== 'object') {
            return value;
        }
        if (seen.has(value)) {
            return __wdioCycle;
        }
        if (__wdioIsBlob(value)) {
            return __wdioSerializeBlob(value);
        }
        if (__wdioIsHostValue(value)) {
            return value;
        }

        seen.add(value);
        try {
            if (__wdioIsFileList(value)) {
                const listed = [];
                for (let i = 0; i < value.length; i++) {
                    listed.push(value[i]);
                }
                const { changed, copy } = await __wdioSerializeEntries(listed, seen);
                return changed ? copy : value;
            }
            if (typeof Map !== 'undefined' && value instanceof Map) {
                let changed = false;
                const entries = [];
                for (const [key, entry] of value) {
                    const nextKey = await __wdioSerializeValue(key, seen);
                    const nextValue = await __wdioSerializeValue(entry, seen);
                    if ((nextKey !== __wdioCycle && nextKey !== key) || (nextValue !== __wdioCycle && nextValue !== entry)) {
                        changed = true;
                    }
                    entries.push([
                        nextKey === __wdioCycle ? null : nextKey,
                        nextValue === __wdioCycle ? null : nextValue
                    ]);
                }
                return changed ? new Map(entries) : value;
            }
            if (typeof Set !== 'undefined' && value instanceof Set) {
                const { changed, copy } = await __wdioSerializeEntries(value, seen);
                return changed ? new Set(copy) : value;
            }
            if (Array.isArray(value)) {
                const { changed, copy } = await __wdioSerializeEntries(value, seen);
                return changed ? copy : value;
            }

            let changed = false;
            const copy = {};
            for (const key of Object.keys(value)) {
                const next = await __wdioSerializeValue(value[key], seen);
                if (next === __wdioCycle) {
                    copy[key] = null;
                    continue;
                }
                if (next !== value[key]) {
                    changed = true;
                }
                copy[key] = next;
            }
            return changed ? copy : value;
        } finally {
            seen.delete(value);
        }
    }
`

/**
 * BiDi function declaration for `execute`.
 *
 * The user script stays between the script markers, on the same lines
 * `createFunctionDeclarationFromString` would emit, so a thrown line still
 * points at the user's code. Blob encoding runs only after that call returns.
 * A rejected user promise is returned as-is: the `.then` has no rejection
 * handler, so the original throw location is preserved.
 */
export function createBidiFunctionDeclaration (script: string | Function): string {
    const userScript = typeof script === 'string' ? new Function(script) : script
    const declaration = new Function(
        `return (${SCRIPT_PREFIX}${userScript.toString()}${SCRIPT_SUFFIX}).apply(this, arguments);`
    ).toString()

    const markerIndex = declaration.indexOf(SCRIPT_PREFIX)
    const returnIndex = declaration.lastIndexOf('return (', markerIndex)
    const suffixIndex = declaration.indexOf(SCRIPT_SUFFIX)
    const applyToken = ').apply(this, arguments);'
    const applyIndex = declaration.indexOf(applyToken, suffixIndex)
    if (returnIndex === -1 || applyIndex === -1) {
        throw new Error('Unable to wrap BiDi execute script')
    }

    const resultPrefix = 'const __wdioResult = ('
    const withResult = declaration.slice(0, returnIndex)
        + resultPrefix
        + declaration.slice(returnIndex + 'return ('.length)
    const applyEnd = applyIndex + (resultPrefix.length - 'return ('.length) + applyToken.length

    return withResult.slice(0, applyEnd)
        + `\n${SERIALIZER_HELPER}\nreturn Promise.resolve(__wdioResult).then((value) => __wdioSerializeValue(value, new WeakSet()));\n`
        + withResult.slice(applyEnd)
}

function decodedByteLength (data: string) {
    if (data.length === 0) {
        return 0
    }
    const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0
    return (data.length / 4) * 3 - padding
}

function decodeBase64 (data: string) {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(data, 'base64')
    }

    const binary = atob(data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

export function isSerializedBlobValue (value: unknown): value is SerializedBlobValue {
    if (typeof value !== 'object' || value === null) {
        return false
    }

    const serialized = value as Record<string, unknown>
    if (serialized[SERIALIZED_BLOB_KEY] !== true) {
        return false
    }
    if (serialized.kind !== SERIALIZED_BLOB_KIND_BLOB && serialized.kind !== SERIALIZED_BLOB_KIND_FILE) {
        return false
    }
    const allowedKeys = serialized.kind === SERIALIZED_BLOB_KIND_FILE ? FILE_TRANSFER_KEYS : BLOB_TRANSFER_KEYS
    if (!Object.keys(serialized).every((key) => allowedKeys.has(key))) {
        return false
    }
    if (typeof serialized.data !== 'string' || !BASE64_PATTERN.test(serialized.data)) {
        return false
    }
    if (typeof serialized.type !== 'string') {
        return false
    }
    if (typeof serialized.size !== 'number' || !Number.isInteger(serialized.size) || serialized.size < 0) {
        return false
    }
    if (decodedByteLength(serialized.data) !== serialized.size) {
        return false
    }
    if (serialized.name !== undefined && typeof serialized.name !== 'string') {
        return false
    }
    if (serialized.lastModified !== undefined && typeof serialized.lastModified !== 'number') {
        return false
    }
    return true
}

export function createBlobFromSerializedValue (value: SerializedBlobValue) {
    const bytes = decodeBase64(value.data)
    if (value.kind === SERIALIZED_BLOB_KIND_FILE && typeof File === 'function') {
        return new File([bytes], value.name ?? 'file', {
            type: value.type,
            lastModified: typeof value.lastModified === 'number' ? value.lastModified : Date.now()
        })
    }
    if (typeof Blob === 'function') {
        return new Blob([bytes], { type: value.type })
    }
    return bytes
}
