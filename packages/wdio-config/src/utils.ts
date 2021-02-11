import logger from '@wdio/logger'
import type { Capabilities, Options } from '@wdio/types'
import type { RegisterOptions } from 'ts-node'

const log = logger('@wdio/config:utils')

export const validObjectOrArray = (object: any): object is object | Array<any> => (Array.isArray(object) && object.length > 0) ||
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
    return specs.some((s) => s.match(/:\d+(:\d+$|$)/))
}

export function isCloudCapability(caps: Capabilities.Capabilities) {
    return Boolean(caps && (caps['bstack:options'] || caps['sauce:options'] || caps['tb:options']))
}

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
            throw new Error(`Required option "${name}" is missing`)
        }

        if (typeof options[name] === 'undefined' && expectedOption.default) {
            params[name] = expectedOption.default
        }

        if (typeof options[name] !== 'undefined') {
            const optValue = options[name]
            if (typeof optValue !== expectedOption.type) {
                throw new Error(`Expected option "${name}" to be type of ${expectedOption.type} but was ${typeof options[name]}`)
            }

            if (typeof expectedOption.validate === 'function') {
                try {
                    expectedOption.validate(optValue)
                } catch (e) {
                    throw new Error(`Type check for option "${name}" failed: ${e.message}`)
                }
            }

            if (typeof optValue === 'string' && expectedOption.match && !optValue.match(expectedOption.match)) {
                throw new Error(`Option "${name}" doesn't match expected values: ${expectedOption.match}`)
            }

            params[name] = options[name]
        }
    }

    for (const [name, option] of Object.entries(options) as [keyof T, T[keyof T]][]) {
        /**
         * keep keys from source object if desired
         */
        if (keysToKeep.includes(name)) {
            params[name] = option
        }
    }

    return params
}

export interface ModuleRequireService {
    resolve(request: string, options?: { paths?: string[]; }): string
    require<T>(module: string): T;
}

export function loadAutoCompilers(autoCompileConfig: Options.AutoCompileConfig, requireService: ModuleRequireService) {
    return autoCompileConfig.autoCompile && (
        loadTypeScriptCompiler(autoCompileConfig.tsNodeOpts, requireService)
        ||
        loadBabelCompiler(autoCompileConfig.babelOpts, requireService)
    )
}

export function loadTypeScriptCompiler (tsNodeOpts: RegisterOptions = {}, requireService: ModuleRequireService) {
    try {
        requireService.resolve('ts-node') as any
        (requireService.require('ts-node') as any).register(tsNodeOpts)
        log.debug('Found \'ts-node\' package, auto-compiling TypeScript files')
        return true
    } catch (e) {
        return false
    }
}

export function loadBabelCompiler (babelOpts: Record<string, any> = {}, requireService: ModuleRequireService) {
    try {
        requireService.resolve('@babel/register') as any

        /**
         * only for testing purposes
         */
        if (process.env.JEST_WORKER_ID && process.env.THROW_BABEL_REGISTER) {
            throw new Error('test fail')
        }

        (requireService.require('@babel/register') as any)(babelOpts)
        log.debug('Found \'@babel/register\' package, auto-compiling files with Babel')
        return true
    } catch (e) {
        return false
    }
}
