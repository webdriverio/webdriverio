import supportsColor from './supportsColor.js'
import { COLORS } from './constants.js'

const FIRST_FUNCTION_REGEX = /function (\w+)/

/**
 * replaces whitespaces with underscore and removes dots
 * @param  {string} str  variable to sanitize
 * @return {String}      sanitized variable
 */
export function sanitizeString (str?: string) {
    if (!str) {
        return ''
    }

    return String(str)
        .replace(/^.*\/([^/]+)\/?$/, '$1')
        .replace(/\./g, '_')
        .replace(/\s/g, '')
        .toLowerCase()
}

/**
 * formats capability object into sanitized string for e.g.filenames
 * @param {object} caps  Selenium capabilities
 */
export function sanitizeCaps (caps?: WebdriverIO.Capabilities) {
    if (!caps) {
        return ''
    }

    let result

    /**
     * mobile caps
     */
    // @ts-expect-error outdated JSONWP capabilities
    result = caps['appium:deviceName'] || caps.deviceName
        ? [
            sanitizeString(caps.platformName),
            // @ts-expect-error outdated JSONWP capabilities
            sanitizeString(caps['appium:deviceName'] || caps.deviceName),
            sanitizeString(caps['appium:platformVersion']),
            sanitizeString(caps['appium:app'])
        ]
        : [
            sanitizeString(caps.browserName),
            // @ts-expect-error outdated JSONWP capabilities
            sanitizeString(caps.version || caps.browserVersion),
            // @ts-expect-error outdated JSONWP capabilities
            sanitizeString(caps.platform || caps.platformName),
            sanitizeString(caps['appium:app'])
        ]

    result = result.filter(n => n !== undefined && n !== '')
    return result.join('.')
}

/**
 * Takes a event emitted by a framework and extracts
 * an array of errors representing test or hook failures.
 * This exists to maintain compatibility between frameworks
 * with have a soft assertion model (Jasmine) and those that
 * have a hard assertion model (Mocha)
 * @param {*} e  An event emitted by a framework adapter
 */
export function getErrorsFromEvent(e: { errors?: Error[]; error?: Error }) {
    if (e.errors) {
        return e.errors
    }
    if (e.error) {
        return [e.error]
    }
    return []
}

/**
 * Pads the given `str` to `len`.
 *
 * @private
 * @param {string} str
 * @param {number} len
 * @return {string}
 */
export function pad (str: string, len: number) {
    return Array(len - str.length + 1).join(' ') + str
}

export function color (type: keyof typeof COLORS, content: string) {
    if (!supportsColor.stdout) {
        return String(content)
    }
    return `\u001b[${COLORS[type]}m${content}\u001b[0m`
}

/**
 * Colors lines for `str`, using the color `name`.
 *
 * @private
 * @param {string} name
 * @param {string} str
 * @return {string}
 */
export function colorLines (name: keyof typeof COLORS, str: string) {
    return str
        .split('\n')
        .map((str) => color(name, str))
        .join('\n')
}

/**
 * Transforms WebDriver execute command scripts to avoid accumulating
 * long scripts in the default TestStats.
 * @param script WebDriver command script
 */
export function transformCommandScript (script?: string|Function) {
    if (!script) {
        return script
    }
    let name = undefined
    if (typeof script === 'string') {
        name = FIRST_FUNCTION_REGEX.exec(script)
        // reset the static RegExp globals to avoid leaking `script`
        FIRST_FUNCTION_REGEX.exec('')
    } else if (typeof script === 'function') {
        name = script.name
        script = script.toString()
    } else {
        return `<${typeof script}>`
    }

    if (typeof name === 'string' && name) {
        return `<script fn ${name}(...)> [${Buffer.byteLength(script, 'utf-8')} bytes]`
    }
    return `<script> [${Buffer.byteLength(script, 'utf-8')} bytes]`
}
