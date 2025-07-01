import crypto from 'node:crypto'
import { describe, it, expect, vi } from 'vitest'

import { isBase64Safe } from '../src/bidi/utils.js'

// Helper functions for the tests
const generateBase64 = (length: number): string => {
    const randomBytes = crypto.randomBytes(length)
    return Buffer.from(randomBytes).toString('base64')
}

const generateInvalidBase64 = (length: number): string => {
    let validBase64 = generateBase64(length)
    if (validBase64.length === 0) {
        validBase64 = 'AA=='
    }

    // Choose a method to make it invalid (randomly)
    const invalidationMethods = [
        // Add invalid characters
        () => {
            const position = Math.floor(Math.random() * validBase64.length)
            const invalidChars = '!@#$%^&*()_{}[]|"\'\\:;<>,.?~`'
            const invalidChar = invalidChars.charAt(Math.floor(Math.random() * invalidChars.length))
            return validBase64.substring(0, position) + invalidChar + validBase64.substring(position + 1)
        },
        // Incorrect padding by adding extra padding or removing required padding
        () => {
            if (validBase64.endsWith('==')) {
                // Remove one = to make it invalid
                return validBase64.substring(0, validBase64.length - 1)
            } else if (validBase64.endsWith('=')) {
                // Add two more = to make it invalid (three = is never valid)
                return validBase64 + '=='
            }
            // For strings without padding, add a single = which will be invalid
            // if the length isn't right for padding
            const validLength = validBase64.length % 4
            if (validLength === 0) {
                // For strings with length multiple of 4, adding a single = is invalid
                return validBase64 + '='
            }
            // Remove a character to disrupt the length then add =
            return validBase64.substring(0, validBase64.length - 1) + '='

        },
        // Insert padding character in the middle (always invalid)
        () => {
            const position = Math.floor(Math.random() * (validBase64.length - 1)) + 1
            return validBase64.substring(0, position) + '=' + validBase64.substring(position)
        },
        // Disrupt the length to make it invalid (base64 length must be multiple of 4)
        () => {
            if (validBase64.length % 4 === 0) {
                // Remove 1 character to make length not a multiple of 4
                return validBase64.substring(0, validBase64.length - 1)
            }
            // Remove extra to ensure the length is invalid
            return validBase64.substring(0, validBase64.length - (validBase64.length % 4) - 1)

        },
        // Guaranteed invalid method - always prepend an invalid character
        () => {
            return '?' + validBase64
        }
    ]

    const method = invalidationMethods[Math.floor(Math.random() * invalidationMethods.length)]
    const result = method()

    return result
}

describe('bidi utils', () => {
    describe('isBase64Safe', () => {
        it('should return false for non-string inputs', () => {
            expect(isBase64Safe(null as any)).toBe(false)
            expect(isBase64Safe(undefined as any)).toBe(false)
            expect(isBase64Safe(123 as any)).toBe(false)
            expect(isBase64Safe({} as any)).toBe(false)
            expect(isBase64Safe([] as any)).toBe(false)
        })

        it('should return true for valid base64 strings', () => {
            expect(isBase64Safe('SGVsbG8gV29ybGQ=')).toBe(true)
            expect(isBase64Safe('dGVzdA==')).toBe(true)
            expect(isBase64Safe('YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWjAxMjM0NTY3ODk=')).toBe(true)
            expect(isBase64Safe('')).toBe(true) // Empty string is valid base64
        })

        it('should return false for invalid base64 strings', () => {
            expect(isBase64Safe('SGVsbG8gV29ybGQ')).toBe(false) // Missing padding
            expect(isBase64Safe('SGVsbG8gV29ybGQ===')).toBe(false) // Too much padding
            expect(isBase64Safe('SGVsbG8_V29ybGQ=')).toBe(false) // Invalid character
            expect(isBase64Safe('Hello World')).toBe(false) // Not base64
            expect(isBase64Safe('*&^%$#@!')).toBe(false) // Special characters
        })

        it('should handle large strings efficiently', () => {
            const superLargeValidBase64 = 'A'.repeat(1000000)
            expect(isBase64Safe(superLargeValidBase64)).toBe(true)

            const invalidAtStart = '?' + 'A'.repeat(999999)
            expect(isBase64Safe(invalidAtStart)).toBe(false)

            const invalidAtEnd = 'A'.repeat(999999) + '?'
            expect(isBase64Safe(invalidAtEnd)).toBe(false)

            const invalidAtMiddle = 'A'.repeat(500000) + '?' + 'A'.repeat(499999)
            expect(isBase64Safe(invalidAtMiddle)).toBe(false)

            const invalidAtChunkBoundary = 'A'.repeat(99999) + '?' + 'A'.repeat(900000)
            expect(isBase64Safe(invalidAtChunkBoundary)).toBe(false)

            const invalidAtMultipleChunkBoundaries =
                'A'.repeat(99999) + '?' +
                'A'.repeat(99999) + '?' +
                'A'.repeat(800000)
            expect(isBase64Safe(invalidAtMultipleChunkBoundaries)).toBe(false)
        })

        // The case that produced the error
        it('should handle exactly 4,053,844 character strings', () => {
            const exactSizeValidString = 'A'.repeat(4053844)
            expect(isBase64Safe(exactSizeValidString)).toBe(true)

            const invalidAtStartExact = '?' + 'A'.repeat(4053843)
            expect(isBase64Safe(invalidAtStartExact)).toBe(false)

            const invalidAtMiddleExact = 'A'.repeat(2026922) + '?' + 'A'.repeat(2026921)
            expect(isBase64Safe(invalidAtMiddleExact)).toBe(false)

            const invalidAtEndExact = 'A'.repeat(4053843) + '?'
            expect(isBase64Safe(invalidAtEndExact)).toBe(false)

            expect(isBase64Safe(exactSizeValidString)).toBe(true)
            expect(isBase64Safe(exactSizeValidString)).toBe(true)
            expect(isBase64Safe(invalidAtMiddleExact)).toBe(false)
        })

        it('should validate random valid base64 strings of various lengths', {
            timeout: 60_000
        }, () => {
            // Test valid strings
            for (let i = 0; i < 10000; i++) {
                // Generate random length between 0 and 1000000
                const length = Math.floor(Math.pow(Math.random(), 2) * 1000000)
                const validString = generateBase64(length)

                const result = isBase64Safe(validString)
                if (!result) {
                    // If validation fails, log the string details
                    console.error(`Valid string failed validation: Length=${validString.length}`)
                    console.error(`String: ${validString}`)
                    console.error(`Padding count: ${(validString.match(/=/g) || []).length}`)
                }
                expect(result).toBe(true)
            }
        })

        it('should identify random invalid base64 strings of various lengths', {
            timeout: 10_000
        }, () => {
            // Test invalid strings
            for (let i = 0; i < 10000; i++) {
                // Generate random length between 1 and 1000000
                const length = Math.max(1, Math.floor(Math.pow(Math.random(), 2) * 1000000))
                const invalidString = generateInvalidBase64(length)

                const result = isBase64Safe(invalidString)
                if (result) {
                    // If validation unexpectedly passes, log the string details
                    console.error(`Invalid string incorrectly passed validation: Length=${invalidString.length}`)
                    console.error(`String: ${invalidString}`)
                    console.error(`Padding count: ${(invalidString.match(/=/g) || []).length}`)
                }
                expect(result).toBe(false)
            }
        })
    })
})
