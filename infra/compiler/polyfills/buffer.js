// Buffer polyfill - implementation for WebdriverIO needs
// Required for base64 encoding/decoding in interception module
class BufferPolyfill extends Uint8Array {
    // Mark instances with a symbol for isBuffer detection
    static #isBufferSymbol = Symbol.for('BufferPolyfill')

    constructor(...args) {
        super(...args)
        // Tag this instance as a Buffer
        Object.defineProperty(this, BufferPolyfill.#isBufferSymbol, { value: true })
    }

    static from(data, encoding) {
        if (typeof data === 'string') {
            if (encoding === 'base64') {
                const binary = atob(data)
                const bytes = new Uint8Array(binary.length)
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i)
                }
                return new BufferPolyfill(bytes.buffer, bytes.byteOffset, bytes.byteLength)
            }
            if (encoding === 'hex') {
                // Validate hex string has even length
                if (data.length % 2 !== 0) {
                    throw new RangeError(`Invalid hex string length: expected even number, got ${data.length}`)
                }
                // Validate all characters are valid hex
                if (!/^[0-9a-fA-F]*$/.test(data)) {
                    throw new TypeError('Invalid hex string: contains non-hexadecimal characters')
                }
                const byteCount = data.length / 2
                const bytes = new Uint8Array(byteCount)
                for (let i = 0; i < byteCount; i++) {
                    const hexPair = data.substring(i * 2, i * 2 + 2)
                    const byteValue = parseInt(hexPair, 16)
                    // Additional validation (shouldn't fail after regex check, but defensive)
                    if (Number.isNaN(byteValue) || byteValue < 0 || byteValue > 255) {
                        throw new TypeError(`Invalid hex pair at position ${i * 2}: "${hexPair}"`)
                    }
                    bytes[i] = byteValue
                }
                return new BufferPolyfill(bytes.buffer, bytes.byteOffset, bytes.byteLength)
            }
            // Default: UTF-8 encoding
            const bytes = new TextEncoder().encode(data)
            return new BufferPolyfill(bytes.buffer, bytes.byteOffset, bytes.byteLength)
        }
        // Reject numeric input - Node's Buffer.from(number) throws TypeError
        if (typeof data === 'number') {
            throw new TypeError('The "value" argument must not be of type number. Received type number')
        }
        const bytes = new Uint8Array(data)
        return new BufferPolyfill(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    }

    static alloc(size) {
        return new BufferPolyfill(size)
    }

    /**
     * Returns true only for BufferPolyfill instances, not any Uint8Array.
     */
    static isBuffer(obj) {
        return obj !== null && obj !== undefined && obj[BufferPolyfill.#isBufferSymbol] === true
    }

    static concat(list) {
        const totalLength = list.reduce((acc, arr) => acc + arr.length, 0)
        const result = new Uint8Array(totalLength)
        let offset = 0
        for (const arr of list) {
            result.set(arr, offset)
            offset += arr.length
        }
        return new BufferPolyfill(result.buffer, result.byteOffset, result.byteLength)
    }

    static byteLength(value, encoding) {
        if (typeof value === 'string') {
            const enc = (encoding || 'utf8').toLowerCase()
            if (enc === 'base64') {
                return atob(value).length
            }
            if (enc === 'hex') {
                if (value.length % 2 !== 0) {
                    throw new RangeError(`Invalid hex string length: expected even number, got ${value.length}`)
                }
                if (!/^[0-9a-fA-F]*$/.test(value)) {
                    throw new TypeError('Invalid hex string: contains non-hexadecimal characters')
                }
                return value.length / 2
            }
            return new TextEncoder().encode(value).length
        }

        if (typeof value === 'number') {
            throw new TypeError('The "value" argument must not be of type number. Received type number')
        }

        if (ArrayBuffer.isView(value)) {
            return value.byteLength
        }
        if (value instanceof ArrayBuffer) {
            return value.byteLength
        }

        const bytes = new Uint8Array(value)
        return bytes.byteLength
    }

    static toString(buf, encoding) {
        if (encoding === 'base64') {
            let binary = ''
            for (let i = 0; i < buf.length; i++) {
                binary += String.fromCharCode(buf[i])
            }
            return btoa(binary)
        }
        if (encoding === 'hex') {
            let hex = ''
            for (let i = 0; i < buf.length; i++) {
                const b = buf[i]
                hex += (b < 16 ? '0' : '') + b.toString(16)
            }
            return hex
        }
        return new TextDecoder().decode(buf)
    }

    toString(encoding) {
        return BufferPolyfill.toString(this, encoding)
    }
}

export const Buffer = BufferPolyfill
export default { Buffer: BufferPolyfill }
