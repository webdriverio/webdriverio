export function encodeBase64(bytes: Uint8Array) {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64')
    }

    let binary = ''
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
    }
    return btoa(binary)
}

export function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(value, 'base64')
    }

    return Uint8Array.from(atob(value), byte => byte.charCodeAt(0))
}
