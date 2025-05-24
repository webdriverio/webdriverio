export const SENSITIVE_DATA_REPLACER = '**MASKED**'

const skipError = (aFunction: Function) => {
    try {
        return aFunction()
    } catch {
        return undefined
    }
}

export const parseMaskingPatterns = (maskingRegexString: string | undefined) => {
    if (typeof maskingRegexString !== 'string') { return undefined }
    const regexStrings = maskingRegexString?.split(',').filter((regexStr) => regexStr.trim() !== '')

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

export const mask = <T = unknown>(possibleText: T, maskingPatterns: RegExp[] | undefined) => {
    if (!maskingPatterns || typeof possibleText !== 'string') { return possibleText }

    let maskedText = possibleText as string
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
