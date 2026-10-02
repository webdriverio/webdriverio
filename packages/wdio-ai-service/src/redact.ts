const PLACEHOLDER = /\{\{\s*([\w.-]+)\s*\}\}/g

/**
 * Names of the `{{placeholders}}` in a text.
 */
export function placeholdersIn (text: string): string[] {
    return [...new Set([...text.matchAll(PLACEHOLDER)].map((match) => match[1]))]
}

/**
 * Fail early when an instruction uses a placeholder without a value.
 */
export function assertValues (instruction: string, values: Record<string, string> = {}) {
    const missing = placeholdersIn(instruction).filter((name) => !(name in values))
    if (missing.length) {
        throw new Error(`[@wdio/ai-service] No value for ${missing.map((name) => `{{${name}}}`).join(', ')}. Pass it in \`values\`.`)
    }
}

/**
 * Replace `{{name}}` with its value in a string, or in every string of an
 * array or plain object.
 */
export function substitute<T> (input: T, values: Record<string, string> = {}): T {
    if (typeof input === 'string') {
        return input.replace(PLACEHOLDER, (match, name: string) => name in values ? values[name] : match) as T
    }
    if (Array.isArray(input)) {
        return input.map((item) => substitute(item, values)) as T
    }
    if (input && typeof input === 'object') {
        return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, substitute(value, values)])) as T
    }
    return input
}

/**
 * Replace every value with its `{{name}}`, in a string, an array or a plain
 * object. Longer values go first, so a value that contains another value is
 * replaced as a whole.
 */
export function redact<T> (input: T, values: Record<string, string> = {}): T {
    const entries = Object.entries(values)
        .filter(([, value]) => typeof value === 'string' && value.length > 0)
        .sort(([, a], [, b]) => b.length - a.length)
    if (!entries.length) {
        return input
    }
    const apply = (value: unknown): unknown => {
        if (typeof value === 'string') {
            return entries.reduce((text, [name, secret]) => text.split(secret).join(`{{${name}}}`), value)
        }
        if (Array.isArray(value)) {
            return value.map(apply)
        }
        if (value && typeof value === 'object') {
            return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, apply(item)]))
        }
        return value
    }
    return apply(input) as T
}
