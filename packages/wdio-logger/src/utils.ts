export const SENSITIVE_DATA_REPLACER = '**MASKED**'

const skipError = (aFunction: Function) => {
    try {
        return aFunction()
    } catch {
        return undefined
    }
}

/**
 * Parses a comma-separated string of regular expressions into an array of RegExp objects.
 * Supports both `/pattern/flags` and plain pattern formats.
 *
 * @param {string | undefined} maskingRegexString - The string containing regex patterns.
 * @returns {(RegExp[] | undefined)} Array of RegExp objects or undefined if input is invalid.
 */
export const parseMaskingPatterns = (maskingRegexString: string | undefined) => {
    if (typeof maskingRegexString !== 'string') { return undefined }
    const regexStrings = maskingRegexString?.split(/,\s*/).filter((regexStr) => regexStr.trim() !== '')

    return regexStrings?.map((regexStr) => {
        const regexParts = regexStr.match(/^\/(.*?)\/([gimsuy]*)$/)
        if (!regexParts) {
            // When passing only a simple string without `/` or flags, aka `(--key=)([^ ]*)`
            return skipError(() => new RegExp(regexStr))
        } else if (regexParts?.[1]) {
            // Case with flag `/(--key=)([^ ]*)/i` or without flag `/(--key=)([^ ]*)/`
            return skipError(() => regexParts[2] ? new RegExp(regexParts[1], regexParts[2]) : new RegExp(regexParts[1]))
        }
        return undefined

    }).filter((regex) => regex !== undefined)
}

/**
 * Masks sensitive data in a string using the provided masking patterns.
 *
 * - If a pattern has no capturing groups, the whole match is replaced with the mask.
 * - If a pattern has capturing groups, each group is replaced with the mask, preserving the rest of the match.
 *
 * @param {string} text - The text to mask.
 * @param {RegExp[] | undefined} maskingPatterns - Array of RegExp patterns to use for masking.
 * @returns {string} The masked text, or the original value if not a string or if no patterns are provided.
 */
export const mask = (text: string, maskingPatterns: RegExp[] | undefined) => {
    if (!maskingPatterns || typeof text !== 'string') { return text }

    let maskedText = text
    maskingPatterns.forEach((maskingRegex) => {

        // Replace the whole match when no capturing groups or each capturing group
        maskedText = maskedText.replace(maskingRegex, (fullMatch, ...capturedGroupsAndMore) => {
            const capturedGroups = capturedGroupsAndMore.slice(0, capturedGroupsAndMore.length - 2)

            if (capturedGroups.length === 0) {
                return SENSITIVE_DATA_REPLACER
            }

            let matchedMaskedText = fullMatch
            capturedGroups.forEach((group) => {
                matchedMaskedText = matchedMaskedText.replace(group, SENSITIVE_DATA_REPLACER )
            })
            return matchedMaskedText
        })
    })
    return maskedText
}
