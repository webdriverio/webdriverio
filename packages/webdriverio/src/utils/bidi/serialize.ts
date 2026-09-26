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
 * This module does not import Node builtins. The browser runner loads it too.
 */

export const SERIALIZED_BLOB_KEY = '__wdioSerializedBlob__'
export const SERIALIZED_BLOB_KIND_BLOB = 'blob'
export const SERIALIZED_BLOB_KIND_FILE = 'file'

const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/

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
        if (typeof File !== 'undefined' && blob instanceof File) {
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
        if (typeof Blob !== 'undefined' && value instanceof Blob) {
            return __wdioSerializeBlob(value);
        }
        if (__wdioIsHostValue(value)) {
            return value;
        }

        seen.add(value);
        try {
            if (typeof FileList !== 'undefined' && value instanceof FileList) {
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

export function createSerializableScript (script: Function) {
    return `
        const userScript = ${script.toString()};
        ${SERIALIZER_HELPER}
        return (async () => {
            const result = await userScript.apply(this, arguments);
            return __wdioSerializeValue(result, new WeakSet());
        })();
    `
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
