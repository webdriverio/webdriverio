import url from 'node:url'
import path from 'node:path'
import logger from '@wdio/logger'
import decamelize from 'decamelize'
import { resolve } from 'import-meta-resolve'
import type { Capabilities, Options } from '@wdio/types'

import type { ModuleImportService } from './types.js'

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
                } catch (e: any) {
                    throw new Error(`Type check for option "${name.toString()}" failed: ${e.message}`)
                }
            }

            if (typeof optValue === 'string' && expectedOption.match && !optValue.match(expectedOption.match)) {
                throw new Error(`Option "${name.toString()}" doesn't match expected values: ${expectedOption.match}`)
            }

            params[name] = options[name]
        }
    }

    for (const [name, option] of Object.entries(options as any) as [keyof T, T[keyof T]][]) {
        /**
         * keep keys from source object if desired
         */
        if (keysToKeep.includes(name)) {
            params[name] = option
        }
    }

    return params
}

export async function loadAutoCompilers(autoCompileConfig: Options.AutoCompileConfig, requireService: ModuleImportService) {
    if (!autoCompileConfig.autoCompile) {
        return
    }

    return (
        await loadTypeScriptCompiler(autoCompileConfig) ||
        await loadBabelCompiler(
            autoCompileConfig.babelOpts,
            requireService
        )
    )
}

export async function loadTypeScriptCompiler (autoCompileConfig: Options.AutoCompileConfig) {
    /**
     * don't auto compile within worker as it already was spawn with a loader
     */
    if (process.env.WDIO_WORKER_ID) {
        return false
    }

    try {
        /**
         * only for testing purposes
         */
        if (process.env.VITEST_WORKER_ID && process.env.THROW_TSNODE_RESOLVE) {
            throw new Error('test fail')
        }
        await resolve('ts-node', import.meta.url)
        process.env.WDIO_LOAD_TS_NODE = '1'
        objectToEnv(autoCompileConfig.tsNodeOpts)
        return true
    } catch (err: any) {
        log.debug(`Failed loading TS Node: ${err.message}`)
        return false
    }
}

export function objectToEnv (params?: Record<string, any>) {
    /**
     * apply all config options as environment variables
     */
    for (const [key, value] of Object.entries(params || {})) {
        const envKey = decamelize(key).toUpperCase()
        if (Array.isArray(value)) {
            process.env[envKey] = value.join(',')
        } else if (typeof value === 'boolean' && value) {
            process.env[envKey] = '1'
        } else if (value instanceof RegExp) {
            process.env[envKey] = value.toString()
        } else if (typeof value === 'object') {
            process.env[envKey] = JSON.stringify(value)
        } else if (value && typeof value.toString === 'function') {
            process.env[envKey] = value.toString()
        }
    }
}

export async function loadBabelCompiler (babelOpts: Record<string, any> = {}, requireService: ModuleImportService) {
    try {
        /**
         * only for testing purposes
         */
        if (process.env.VITEST_WORKER_ID && process.env.THROW_BABEL_REGISTER) {
            throw new Error('test fail')
        }

        (await requireService.import('@babel/register') as any)(babelOpts)
        log.debug('Found \'@babel/register\' package, auto-compiling files with Babel')
        return true
    } catch (err: any) {
        return false
    }
}

export function makeRelativeToCWD (files: (string | string[])[] = []): (string | string[])[] {
    const returnFiles: (string | string[])[] = []

    for (const file of files) {
        if (Array.isArray(file)) {
            returnFiles.push(makeRelativeToCWD(file) as string[])
            continue
        }

        returnFiles.push(file.startsWith('file:///')
            ? url.fileURLToPath(file)
            : path.resolve(process.cwd(), file))
    }

    return returnFiles
}
