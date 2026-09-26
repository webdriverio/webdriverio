import { describe, it, expect, afterEach } from 'vitest'

import { SCRIPT_PREFIX, SCRIPT_SUFFIX } from '../../../src/commands/constant.js'
import { createFunctionDeclarationFromString } from '../../../src/utils/index.js'
import { deserialize } from '../../../src/utils/bidi/index.js'
import { LocalValue } from '../../../src/utils/bidi/value.js'
import {
    SERIALIZED_BLOB_KEY,
    SERIALIZED_BLOB_KIND_BLOB,
    createBidiFunctionDeclaration,
    isSerializedBlobValue
} from '../../../src/utils/bidi/serialize.js'

async function bytesOf (blob: Blob) {
    return [...new Uint8Array(await blob.arrayBuffer())]
}

function declare (script: Function) {
    return createBidiFunctionDeclaration(script)
}

async function runInBrowser<T> (script: Function, thisArg?: unknown, args: unknown[] = []): Promise<T> {
    const fn = new Function(`return (${declare(script)})`)() as (this: unknown, ...args: unknown[]) => Promise<T>
    return fn.apply(thisArg, args)
}

function asRemote (value: unknown) {
    return LocalValue.getArgument(value).asMap()
}

async function roundTrip<T> (script: Function, thisArg?: unknown, args: unknown[] = []): Promise<T> {
    const raw = await runInBrowser(script, thisArg, args)
    return deserialize(asRemote(raw)) as T
}

class TestFileList {
    length: number
    [index: number]: File

    get [Symbol.toStringTag] () {
        return 'FileList'
    }

    constructor (files: File[]) {
        files.forEach((file, index) => {
            this[index] = file
        })
        this.length = files.length
    }
}

describe('BiDi blob serialization', () => {
    afterEach(() => {
        Reflect.deleteProperty(globalThis, 'FileList')
    })

    it('returns the bytes and type of a Blob', async () => {
        const blob = await roundTrip<Blob>(() => new Blob(['Hello World'], { type: 'text/plain' }))

        expect(blob).toBeInstanceOf(Blob)
        expect(blob.type).toBe('text/plain')
        expect(blob.size).toBe(11)
        expect(await blob.text()).toBe('Hello World')
    })

    it('keeps binary bytes, including values above 127', async () => {
        const blob = await roundTrip<Blob>(() => new Blob([new Uint8Array([0, 127, 128, 255, 10])], {
            type: 'application/octet-stream'
        }))

        expect(await bytesOf(blob)).toEqual([0, 127, 128, 255, 10])
    })

    it('round-trips a Blob larger than one base64 chunk', async () => {
        const blob = await roundTrip<Blob>(() => {
            const bytes = new Uint8Array(100_000)
            bytes[0] = 1
            bytes[50_000] = 128
            bytes[99_999] = 255
            return new Blob([bytes], { type: 'application/octet-stream' })
        })

        const bytes = await bytesOf(blob)
        expect(bytes.length).toBe(100_000)
        expect(bytes[0]).toBe(1)
        expect(bytes[50_000]).toBe(128)
        expect(bytes[99_999]).toBe(255)
    })

    it('round-trips an empty Blob', async () => {
        const blob = await roundTrip<Blob>(() => new Blob([], { type: 'text/plain' }))

        expect(blob.size).toBe(0)
        expect(blob.type).toBe('text/plain')
        expect(await blob.text()).toBe('')
    })

    it('restores a File name, timestamp, type, and bytes', async () => {
        const file = await roundTrip<File>(() => new File([new Uint8Array([1, 2, 3])], 'notes.txt', {
            type: 'text/plain',
            lastModified: 1_700_000_000_000
        }))

        expect(file).toBeInstanceOf(File)
        expect(file.name).toBe('notes.txt')
        expect(file.type).toBe('text/plain')
        expect(file.lastModified).toBe(1_700_000_000_000)
        expect(await bytesOf(file)).toEqual([1, 2, 3])
    })

    it('restores a Blob nested in an array or plain object', async () => {
        const result = await roundTrip<{ files: Blob[], n: number }>(() => ({
            files: [new Blob(['nested'], { type: 'text/plain' })],
            n: 1
        }))

        expect(result.n).toBe(1)
        expect(result.files[0]).toBeInstanceOf(Blob)
        expect(await result.files[0].text()).toBe('nested')
    })

    it('restores a Blob stored in a Map or Set', async () => {
        const result = await roundTrip<{
            map: Map<string, Blob | number>
            set: Set<Blob | string>
        }>(() => {
            const map = new Map<string, Blob | number>([
                ['a', new Blob(['m'], { type: 'text/plain' })],
                ['b', 1]
            ])
            const set = new Set<Blob | string>([new Blob(['s'], { type: 'text/plain' }), 'keep'])
            return { map, set }
        })

        const mapped = result.map.get('a')
        expect(mapped).toBeInstanceOf(Blob)
        expect(await (mapped as Blob).text()).toBe('m')
        expect(result.map.get('b')).toBe(1)

        const files = [...result.set].filter((entry): entry is Blob => entry instanceof Blob)
        expect(files).toHaveLength(1)
        expect(await files[0].text()).toBe('s')
        expect(result.set.has('keep')).toBe(true)
    })

    it('restores a Blob on a class instance as a plain object', async () => {
        const result = await roundTrip<{ blob: Blob, n: number }>(() => {
            class Holder {
                blob = new Blob(['x'], { type: 'text/plain' })
                n = 1
            }
            return new Holder()
        })

        expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
        expect(result.n).toBe(1)
        expect(await result.blob.text()).toBe('x')
    })

    it('returns a FileList as an array of File objects', async () => {
        Object.defineProperty(globalThis, 'FileList', {
            value: TestFileList,
            configurable: true,
            writable: true
        })

        const files = await roundTrip<File[]>(() => {
            const file = new File(['z'], 'z.txt', { type: 'text/plain', lastModified: 5 })
            const List = (globalThis as { FileList: new (entries: File[]) => unknown }).FileList
            return new List([file])
        })

        expect(Array.isArray(files)).toBe(true)
        expect(files).toHaveLength(1)
        expect(files[0]).toBeInstanceOf(File)
        expect(files[0].name).toBe('z.txt')
        expect(files[0].lastModified).toBe(5)
        expect(await files[0].text()).toBe('z')
    })

    it('returns a blob-free graph by the same references', async () => {
        const result = await runInBrowser<{
            x: { a: number }
            y: { a: number }
            date: Date
            self?: object
        }>(() => {
            const shared = { a: 1 }
            const date = new Date(0)
            const root: {
                x: { a: number }
                y: { a: number }
                date: Date
                self?: object
            } = { x: shared, y: shared, date }
            root.self = root
            return root
        })

        expect(result.x).toBe(result.y)
        expect(result.self).toBe(result)
        expect(result.date).toBeInstanceOf(Date)
        expect(result.date.getTime()).toBe(0)
    })

    it('replaces a cycle with null when the graph also contains a Blob', async () => {
        const result = await roundTrip<{ blob: Blob, self: null }>(() => {
            const root: { blob: Blob, self?: object } = {
                blob: new Blob(['c'], { type: 'text/plain' })
            }
            root.self = root
            return root
        })

        expect(result.self).toBeNull()
        expect(await result.blob.text()).toBe('c')
    })

    it('passes arguments and this through to the user script', async () => {
        const blob = await roundTrip<Blob>(function (this: { label: string }, extra: string) {
            return new Blob([this.label, extra], { type: 'text/plain' })
        }, { label: 'ctx' }, ['!'])

        expect(await blob.text()).toBe('ctx!')
    })

    it('awaits an async script', async () => {
        const blob = await roundTrip<Blob>(async () => {
            await Promise.resolve()
            return new Blob(['later'], { type: 'text/plain' })
        })

        expect(await blob.text()).toBe('later')
    })

    it('serializes a Blob from another realm', async () => {
        const blob = await roundTrip<Blob>(() => {
            const bytes = new Uint8Array([104, 105])
            return Object.create({
                [Symbol.toStringTag]: 'Blob',
                type: 'text/plain',
                size: bytes.byteLength,
                arrayBuffer: async () => bytes.buffer
            })
        })

        expect(blob).toBeInstanceOf(Blob)
        expect(blob.type).toBe('text/plain')
        expect(await blob.text()).toBe('hi')
    })

    it('serializes a File from another realm', async () => {
        const file = await roundTrip<File>(() => {
            const bytes = new Uint8Array([97])
            return Object.create({
                [Symbol.toStringTag]: 'File',
                type: 'text/plain',
                size: bytes.byteLength,
                name: 'a.txt',
                lastModified: 9,
                arrayBuffer: async () => bytes.buffer
            })
        })

        expect(file).toBeInstanceOf(File)
        expect(file.name).toBe('a.txt')
        expect(file.lastModified).toBe(9)
        expect(await file.text()).toBe('a')
    })

    it('returns a cross-realm FileList as an array of File objects', async () => {
        const files = await roundTrip<File[]>(() => {
            const file = new File(['z'], 'z.txt', { type: 'text/plain', lastModified: 5 })
            return Object.create({
                [Symbol.toStringTag]: 'FileList',
                length: 1,
                0: file
            })
        })

        expect(Array.isArray(files)).toBe(true)
        expect(files[0]).toBeInstanceOf(File)
        expect(files[0].name).toBe('z.txt')
        expect(await files[0].text()).toBe('z')
    })

    it('keeps own fields on an object that only brands itself as a Blob', async () => {
        const result = await runInBrowser<{ id: number, type: string, arrayBuffer: unknown }>(() => {
            const bytes = new Uint8Array([104, 105])
            return {
                [Symbol.toStringTag]: 'Blob',
                type: 'text/plain',
                size: bytes.byteLength,
                id: 42,
                arrayBuffer: async () => bytes.buffer
            }
        })

        expect(result).not.toBeInstanceOf(Blob)
        expect(result.id).toBe(42)
        expect(result.type).toBe('text/plain')
        expect(typeof result.arrayBuffer).toBe('function')
    })

    it('keeps own fields on a File along with its bytes', async () => {
        const file = await roundTrip<File & { meta: string }>(() => {
            const file = new File([new Uint8Array([1])], 'notes.txt', {
                type: 'text/plain',
                lastModified: 5
            })
            Object.assign(file, { meta: 'keep' })
            return file
        })

        expect(file).toBeInstanceOf(File)
        expect(file.name).toBe('notes.txt')
        expect(file.meta).toBe('keep')
        expect(await bytesOf(file)).toEqual([1])
    })

    it('returns files from a FileList that also has its own field', async () => {
        const raw = await runInBrowser<File[] & { note: string }>(() => {
            const file = new File(['z'], 'z.txt', { type: 'text/plain', lastModified: 5 })
            const list = Object.assign(Object.create({
                [Symbol.toStringTag]: 'FileList',
                length: 1,
                0: file
            }), { note: 'keep' })
            return list
        })

        expect(Array.isArray(raw)).toBe(true)
        expect(raw.note).toBe('keep')

        const files = deserialize(asRemote(raw)) as File[]
        expect(files[0]).toBeInstanceOf(File)
        expect(files[0].name).toBe('z.txt')
        expect(await files[0].text()).toBe('z')
    })

    it('leaves an object that only looks like a serialized blob alone', () => {
        const lookalike = {
            [SERIALIZED_BLOB_KEY]: true,
            data: 'not-really',
            type: 'text/plain',
            size: 1,
            kind: SERIALIZED_BLOB_KIND_BLOB
        }

        expect(isSerializedBlobValue(lookalike)).toBe(false)
        expect(deserialize(asRemote(lookalike))).toEqual(lookalike)
    })

    it('rejects a serialized blob whose size does not match the payload', () => {
        const mismatched = {
            type: 'object',
            value: [
                [SERIALIZED_BLOB_KEY, { type: 'boolean', value: true }],
                ['data', { type: 'string', value: 'YQ==' }],
                ['type', { type: 'string', value: 'text/plain' }],
                ['size', { type: 'number', value: 5 }],
                ['kind', { type: 'string', value: 'blob' }]
            ]
        }

        const result = deserialize(mismatched as never)
        expect(result).not.toBeInstanceOf(Blob)
        expect(result).toMatchObject({
            [SERIALIZED_BLOB_KEY]: true,
            data: 'YQ==',
            size: 5
        })
    })

    it('does not convert a transfer-shaped object that has extra keys', () => {
        const extra = {
            [SERIALIZED_BLOB_KEY]: true,
            kind: SERIALIZED_BLOB_KIND_BLOB,
            data: 'YQ==',
            size: 1,
            type: 'text/plain',
            id: 42
        }

        expect(isSerializedBlobValue(extra)).toBe(false)
        const result = deserialize(asRemote(extra))
        expect(result).not.toBeInstanceOf(Blob)
        expect(result).toMatchObject({ id: 42, data: 'YQ==' })
    })

    it('keeps the user script between the markers and the helper after them', () => {
        const user = function () {
            throw new Error('x')
        }
        const plain = createFunctionDeclarationFromString(user)
        const wrapped = createBidiFunctionDeclaration(user)
        const plainPrefixLine = plain.split('\n').findIndex((line) => line.includes(SCRIPT_PREFIX))
        const wrappedPrefixLine = wrapped.split('\n').findIndex((line) => line.includes(SCRIPT_PREFIX))

        expect(wrappedPrefixLine).toBe(plainPrefixLine)
        expect(wrapped.indexOf(SCRIPT_SUFFIX)).toBeLessThan(wrapped.indexOf('function __wdioSerializeValue'))
        expect(wrapped.slice(0, wrapped.indexOf(SCRIPT_SUFFIX))).not.toContain('__wdioSerializeValue')
    })

    it('keeps a one-line user script on the same line as both script markers', () => {
        const userScript = new Function(
            'return () => { const a = 1; if(a){if(a){throw new Error("Hello Bidi")}} }'
        )() as () => void
        const asyncScript = new Function(
            'return async () => { const a = 1; if(a){if(a){await Promise.reject(new Error("Hello Bidi"))}} }'
        )() as () => Promise<void>

        for (const script of [userScript, asyncScript]) {
            expect(script.toString()).not.toContain('\n')
            const declaration = createBidiFunctionDeclaration(script)
            const marked = declaration.split('\n').filter((line) => line.includes(SCRIPT_PREFIX))
            expect(marked).toHaveLength(1)
            expect(marked[0]).toContain(SCRIPT_SUFFIX)
            expect(marked[0]).toContain('Hello Bidi')
            expect(declaration.indexOf(SCRIPT_SUFFIX)).toBeLessThan(declaration.indexOf('function __wdioSerializeValue'))
        }
    })

    it('propagates a thrown user error without serializing it', async () => {
        await expect(runInBrowser(() => {
            throw new Error('Hello Bidi')
        })).rejects.toThrow('Hello Bidi')

        await expect(runInBrowser(async () => {
            await Promise.reject(new Error('Hello Bidi'))
        })).rejects.toThrow('Hello Bidi')
    })
})
