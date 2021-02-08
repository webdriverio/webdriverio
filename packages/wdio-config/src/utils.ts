import logger from '@wdio/logger'
import type { Capabilities, Options } from '@wdio/types'
import { RegisterOptions } from 'ts-node'

const log = logger('@wdio/config:utils')

const DEFAULT_HOSTNAME = '127.0.0.1'
const DEFAULT_PORT = 4444
const DEFAULT_PROTOCOL = 'http'
const DEFAULT_PATH = '/'
const LEGACY_PATH = '/wd/hub'

const REGION_MAPPING = {
    'us': 'us-west-1.', // default endpoint
    'eu': 'eu-central-1.',
    'eu-central-1': 'eu-central-1.',
    'us-east-1': 'us-east-1.'
}

export const validObjectOrArray = (object: any): object is object | Array<any> => (Array.isArray(object) && object.length > 0) ||
    (typeof object === 'object' && Object.keys(object).length > 0)

export function getSauceEndpoint (
    region: keyof typeof REGION_MAPPING,
    { isRDC, isVisual }: { isRDC?: boolean, isVisual?: boolean } = {}
) {
    const shortRegion = REGION_MAPPING[region] ? region : 'us'
    if (isRDC) {
        return `${shortRegion}1.appium.testobject.com`
    } else if (isVisual) {
        return 'hub.screener.io'
    }

    return `ondemand.${REGION_MAPPING[shortRegion]}saucelabs.com`
}

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

interface BackendConfigurations {
    port?: number
    hostname?: string
    user?: string
    key?: string
    protocol?: string
    region?: string
    headless?: boolean
    path?: string
    capabilities?: Capabilities.RemoteCapabilities | Capabilities.RemoteCapability
}

/**
 * helper to detect the Selenium backend according to given capabilities
 */
export function detectBackend(options: BackendConfigurations = {}) {
    let { port, hostname, user, key, protocol, region, headless, path, capabilities } = options

    /**
     * browserstack
     * e.g. zHcv9sZ39ip8ZPsxBVJ2
     */
    if (typeof user === 'string' && typeof key === 'string' && key.length === 20) {
        return {
            protocol: protocol || 'https',
            hostname: hostname || 'hub-cloud.browserstack.com',
            port: port || 443,
            path: path || LEGACY_PATH
        }
    }

    /**
     * testingbot
     * e.g. ec337d7b677720a4dde7bd72be0bfc67
     */
    if (typeof user === 'string' && typeof key === 'string' && key.length === 32) {
        return {
            protocol: protocol || 'https',
            hostname: hostname || 'hub.testingbot.com',
            port: port || 443,
            path: path || LEGACY_PATH
        }
    }

    /**
     * Sauce Labs
     * e.g. 50aa152c-1932-B2f0-9707-18z46q2n1mb0
     *
     * For Sauce Labs Legacy RDC we only need to determine if the sauce option has a `testobject_api_key`.
     * Same for Sauce Visual where an apiKey can be passed in through the capabilities (soon to be legacy too).
     */
    const isRDC = Boolean(!Array.isArray(capabilities) && (capabilities as WebDriver.DesiredCapabilities)?.testobject_api_key)
    const isVisual = Boolean(!Array.isArray(capabilities) && capabilities && (capabilities as WebDriver.DesiredCapabilities)['sauce:visual']?.apiKey)
    if ((typeof user === 'string' && typeof key === 'string' && key.length === 36) ||
        // Or only RDC or visual
        (isRDC || isVisual)
    ) {
        // Sauce headless is currently only in us-east-1
        const sauceRegion = headless ? 'us-east-1' : region as keyof typeof REGION_MAPPING

        return {
            protocol: protocol || 'https',
            hostname: hostname || getSauceEndpoint(sauceRegion, { isRDC, isVisual }),
            port: port || 443,
            path: path || LEGACY_PATH
        }
    }

    if (
        /**
         * user and key are set in config
         */
        (typeof user === 'string' || typeof key === 'string') &&
        /**
         * but no custom WebDriver endpoint was configured
         */
        !hostname
    ) {
        throw new Error(
            'A "user" or "key" was provided but could not be connected to a ' +
            'known cloud service (Sauce Labs, Browerstack or Testingbot). ' +
            'Please check if given user and key properties are correct!'
        )
    }

    /**
     * default values if on of the WebDriver criticial options is set
     */
    if (hostname || port || protocol || path) {
        return {
            hostname: hostname || DEFAULT_HOSTNAME,
            port: port || DEFAULT_PORT,
            protocol: protocol || DEFAULT_PROTOCOL,
            path: path || DEFAULT_PATH
        }
    }

    /**
     * no cloud provider detected, pass on provided params and eventually
     * fallback to DevTools protocol
     */
    return { hostname, port, protocol, path }
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

export function loadTypeScriptCompiler (tsNodeOpts: RegisterOptions, requireService: ModuleRequireService) {
    try {
        requireService.resolve('ts-node') as any
        (requireService.require('ts-node') as any).register(tsNodeOpts)
        log.debug('Found \'ts-node\' package, auto-compiling TypeScript files')
        return true
    } catch (e) {
        return false
    }
}

export function loadBabelCompiler (babelOpts: { [key: string]: any }, requireService: ModuleRequireService) {
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
