import { BASE_64_REGEX, BASE_64_SAFE_STRING_TO_PROCESS_LENGTH } from '../constants.js'

export function isBase64Safe(str: string): boolean {
    if (typeof str !== 'string') {
        return false
    }

    if (str.length === 0) {
        return true
    }

    if (str.length % 4 !== 0) {
        return false
    }

    const length = str.length

    // Calculate number of digits in the length (e.g., 1000000 => 7)
    const digitCount = length.toString().length

    // Only chunk if length > BASE_64_SAFE_STRING_TO_PROCESS_LENGTH
    if (length > BASE_64_SAFE_STRING_TO_PROCESS_LENGTH) {
        const chunkSize = Math.floor(length / digitCount / 4) * 4
        for (let i = 0; i < length; i += chunkSize) {
            const chunk = str.slice(i, i + chunkSize)
            if (!BASE_64_REGEX.test(chunk)) {
                return false
            }
        }
        return true
    }

    // For shorter strings, validate whole thing
    return BASE_64_REGEX.test(str)
}

