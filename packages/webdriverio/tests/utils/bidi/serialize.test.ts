import { describe, it, expect, vi } from 'vitest'
import { deserialize } from '../../../src/utils/bidi/index.js'
import { isSerializedBlobValue, createBlobFromSerializedValue, SERIALIZED_BLOB_KEY } from '../../../src/utils/bidi/serialize.js'

describe('Bidi Serialization Fix', () => {
    it('isSerializedBlobValue should recognize serialized blobs', () => {
        const serialized = {
            [SERIALIZED_BLOB_KEY]: true,
            data: 'base64str',
            type: 'text/plain'
        }
        expect(isSerializedBlobValue(serialized)).toBe(true)
        expect(isSerializedBlobValue({})).toBe(false)
        expect(isSerializedBlobValue({ other: 'prop' })).toBe(false)
    })

    it('deserialize should handle serialized blobs (currently fails/returns object)', () => {
        // Mock the structure that __wdioSerializeBlob produces and gets sent over Bidi
        // Bidi sends objects as { type: 'object', value: [...] }
        const serializedBlob = {
            type: 'object',
            value: [
                ['__wdioSerializedBlob__', { type: 'boolean', value: true }],
                ['data', { type: 'string', value: 'SGVsbG8gV29ybGQ=' }], // "Hello World" in base64
                ['type', { type: 'string', value: 'text/plain' }]
            ]
        }

        // Current behavior: returns a plain object
        const result = deserialize(serializedBlob as any)

        // With the fix, it should return a Blob (or primitive if Blob not available, but Node has Blob)
        expect(result).toBeDefined()
        // Check if it looks like a Blob (vitest/node Blob)
        if (typeof Blob !== 'undefined' && result instanceof Blob) {
            expect(result.type).toBe('text/plain')
            // Verify content if possible (async text())
        } else {
            // Fallback
            expect(result).toHaveProperty('size')
            expect(result).toHaveProperty('type', 'text/plain')
        }

        // This is what we WANT it to do (return a Buffer or Blob if Blob is available)
        // Since we are in Node, it might be a Buffer or a Blob if global Blob exists (Node 20+ has Blob)
    })

    it('createBlobFromSerializedValue should create a Blob/Buffer', () => {
        const payload = {
            [SERIALIZED_BLOB_KEY]: true,
            data: 'SGVsbG8gV29ybGQ=',
            type: 'text/plain'
        }

        const result = createBlobFromSerializedValue(payload as any)

        // In Node environment, Buffer might be used if Blob is not available, or Blob if it is.
        // Node 18+ has Blob.
        expect(result).toBeDefined()
        if (result instanceof Blob) {
            expect(result.type).toBe('text/plain')
            // verify content?
        } else {
            // Buffer
            expect((result as Buffer).toString()).toBe('Hello World')
        }
    })
})
