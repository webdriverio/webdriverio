import { Buffer } from 'node:buffer'

export const SERIALIZED_BLOB_KEY = '__wdioSerializedBlob__'
export const SERIALIZED_BLOB_KIND_BLOB = 'blob'
export const SERIALIZED_BLOB_KIND_FILE = 'file'

type SerializedBlobKind = typeof SERIALIZED_BLOB_KIND_BLOB | typeof SERIALIZED_BLOB_KIND_FILE

export interface SerializedBlobValue {
    [SERIALIZED_BLOB_KEY]: true
    data: string
    type?: string
    size?: number
    kind?: SerializedBlobKind
    name?: string
    lastModified?: number
}

export const SERIALIZER_HELPER = `
    const __wdioSerializedBlobKey = ${JSON.stringify(SERIALIZED_BLOB_KEY)};
    const __wdioSerializedBlobKindBlob = ${JSON.stringify(SERIALIZED_BLOB_KIND_BLOB)};
    const __wdioSerializedBlobKindFile = ${JSON.stringify(SERIALIZED_BLOB_KIND_FILE)};

    function __wdioIsPlainObject(value) {
        if (!value || typeof value !== 'object') {
            return false;
        }
        const prototype = Object.getPrototypeOf(value);
        return prototype === Object.prototype || prototype === null;
    }

    function __wdioArrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, chunk);
        }
        const encoder =
            typeof btoa === 'function'
                ? btoa
                : (typeof globalThis !== 'undefined' && typeof globalThis.btoa === 'function'
                    ? globalThis.btoa
                    : undefined);
        if (!encoder) {
            throw new Error('Unable to encode Blob data: btoa is not available');
        }
        return encoder(binary);
    }

    async function __wdioSerializeBlob(blob) {
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = __wdioArrayBufferToBase64(arrayBuffer);
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

    async function __wdioSerializeValue(value, seen = new WeakSet()) {
        if (value === null || typeof value !== 'object') {
            return value;
        }
        if (seen.has(value)) {
            return '[Circular]';
        }
        seen.add(value);
        if (typeof Blob !== 'undefined' && value instanceof Blob) {
            seen.delete(value);
            return __wdioSerializeBlob(value);
        }
        if (Array.isArray(value)) {
            const serialized = [];
            for (const element of value) {
                serialized.push(await __wdioSerializeValue(element, seen));
            }
            seen.delete(value);
            return serialized;
        }
        if (__wdioIsPlainObject(value)) {
            const entries = [];
            for (const key of Object.keys(value)) {
                entries.push([
                    key,
                    await __wdioSerializeValue(value[key], seen)
                ]);
            }
            seen.delete(value);
            return Object.fromEntries(entries);
        }
        seen.delete(value);
        return value;
    }
`

function getUserScript (script: string | Function) {
    if (typeof script === 'string') {
        return `function () {\n${script}\n}`
    }
    return script.toString()
}

export function createSerializableScript (script: string | Function) {
    const userScript = getUserScript(script)
    return `
        const userScript = ${userScript};
        ${SERIALIZER_HELPER}
        return (async () => {
            const result = await userScript.apply(this, arguments);
            return __wdioSerializeValue(result);
        })();
    `
}

export function createSerializableAsyncScript (script: string | Function) {
    const userScript = getUserScript(script)
    return `
        const args = Array.from(arguments);
        const userScript = ${userScript};
        ${SERIALIZER_HELPER}
        return new Promise(async (resolve, reject) => {
            const cb = (result) => resolve(__wdioSerializeValue(result));
            try {
                await userScript.apply(this, [...args, cb]);
            } catch (err) {
                reject(err);
            }
        });
    `
}

export function isSerializedBlobValue (value: unknown): value is SerializedBlobValue {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    const serialized = value as Record<string, unknown>
    return serialized[SERIALIZED_BLOB_KEY] === true && typeof serialized.data === 'string'
}

export function createBlobFromSerializedValue (value: SerializedBlobValue) {
    const data = Buffer.from(value.data, 'base64')
    const blobParts = [data]
    const blobOptions = value.type ? { type: value.type } : undefined
    if (value.kind === SERIALIZED_BLOB_KIND_FILE && typeof File === 'function') {
        const name = value.name ?? 'file'
        const lastModified = typeof value.lastModified === 'number' ? value.lastModified : Date.now()
        return new File(blobParts, name, {
            type: value.type ?? '',
            lastModified
        })
    }
    if (typeof Blob === 'function') {
        return new Blob(blobParts, blobOptions)
    }
    return data
}
