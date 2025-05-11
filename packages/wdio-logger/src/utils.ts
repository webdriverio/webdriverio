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
        // Using the below allows supporting the 'g' flags easier, else using 'g' with text.match(regExp) does not output proper capturing groups
        const groupCount = (maskingRegex.source.match(/\((?!\?)/g) || []).length

        // Supporting from 0 to 2 capturing groups, where when having two, only the second group is masked to cover cases like `--key=VALUE` for BrowserStack secret key
        maskedText = maskedText.replace(maskingRegex, groupCount < 2 ? SENSITIVE_DATA_REPLACER: `$1${SENSITIVE_DATA_REPLACER}`)
    })
    return maskedText
}
