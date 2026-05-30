import type { Options } from '@wdio/types'
import { DEFAULT_CONFIGS } from './constants.js'

export const validObjectOrArray = (object: object): object is object | Array<unknown> => (Array.isArray(object) && object.length > 0) ||
    (typeof object === 'object' && Object.keys(object).length > 0)

/**
 * remove line numbers from file path, ex:
 * `/foo:9` or `c:\bar:14:5`
 * @param   {string} filePath path to spec file
 * @returns {string}
 */
export function removeLineNumbers(filePath: string) {
    const matcher = filePath.match(/:\d+(:\d+$|$)/)
    if (matcher) {
        filePath = filePath.substring(0, matcher.index)
    }
    return filePath
}

/**
 * does spec file path contain Cucumber's line number, ex
 * `/foo/bar:9` or `c:\bar\foo:14:5`
 * @param {string|string[]} spec
 */
export function isCucumberFeatureWithLineNumber(spec: string | string[]) {
    const specs = Array.isArray(spec) ? spec : [spec]
    return specs.some((s) => /:\d+(:\d+$|$)/.test(s))
}

export function isCloudCapability(caps: WebdriverIO.Capabilities) {
    return Boolean(caps && (caps['bstack:options'] || caps['sauce:options'] || caps['tb:options']))
}

/**
 * Creates a configuration object while providing types for both TypeScript and Javascript
 */
export const defineConfig = (options?: Partial<WebdriverIO.Config> | WebdriverIO.Config): WebdriverIO.Config => ({
    ...DEFAULT_CONFIGS(),
    ...options,
})

/**
 * validates configurations based on default values
 * @param  {Object} defaults  object describing all allowed properties
 * @param  {Object} options   option to check against
 * @return {Object}           validated config enriched with default values
 */
export function validateConfig<T>(defaults: Options.Definition<T>, options: T, keysToKeep = [] as (keyof T)[]) {
    const params = {} as T

    for (const [name, expectedOption] of Object.entries(defaults) as [keyof Options.Definition<T>, NonNullable<Options.Definition<T>[keyof Options.Definition<T>]>][]) {
        /**
         * check if options is given
         */
        if (typeof options[name] === 'undefined' && !expectedOption.default && expectedOption.required) {
            throw new Error(`Required option "${name.toString()}" is missing`)
        }

        if (typeof options[name] === 'undefined' && expectedOption.default) {
            params[name] = expectedOption.default
        }

        if (typeof options[name] !== 'undefined') {
            const optValue = options[name]
            if (typeof optValue !== expectedOption.type) {
                throw new Error(`Expected option "${name.toString()}" to be type of ${expectedOption.type} but was ${typeof options[name]}`)
            }

            if (typeof expectedOption.validate === 'function') {
                try {
                    expectedOption.validate(optValue)
                } catch (e: unknown) {
                    throw new Error(`Type check for option "${name.toString()}" failed: ${(e as Error).message}`)
                }
            }

            if (typeof optValue === 'string' && expectedOption.match && !optValue.match(expectedOption.match)) {
                throw new Error(`Option "${name.toString()}" doesn't match expected values: ${expectedOption.match}`)
            }

            params[name] = options[name]
        }
    }

    for (const [name, option] of Object.entries(options as object) as [keyof T, T[keyof T]][]) {
        /**
         * keep keys from source object if desired
         */
        if (keysToKeep.includes(name)) {
            params[name] = option
        }
    }

    return params
}
