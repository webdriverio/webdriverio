import url from 'node:url'
import path from 'node:path'
import { builtinModules } from 'node:module'

import logger from '@wdio/logger'
import { polyfillPath } from 'modern-node-polyfills'
import { deepmerge } from 'deepmerge-ts'

import type { Plugin } from 'vite'
import {
    WebDriverProtocol, MJsonWProtocol, AppiumProtocol,
    ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol, GeckoProtocol,
    type Protocol
} from '@wdio/protocols'

import { SESSIONS } from '../../constants.js'
import { getTemplate, getErrorTemplate, normalizeId } from '../utils.js'

const log = logger('@wdio/browser-runner:plugin')
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const commands = deepmerge<any>(
    WebDriverProtocol, MJsonWProtocol, AppiumProtocol,
    ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol, GeckoProtocol
) as Protocol
const protocolCommandList = Object.values(commands).map(
    (endpoint) => Object.values(endpoint).map(
        ({ command }) => command
    )
).flat()
const virtualModuleId = 'virtual:wdio'
const resolvedVirtualModuleId = '\0' + virtualModuleId

/**
 * these modules are used in Node.js environments only and
 * don't need to be compiled, we just have them point to a
 * mocked module that returns a matching interface without
 * functionality
 */
const MODULES_TO_MOCK = [
    'import-meta-resolve', 'puppeteer-core', 'archiver', 'glob', 'ws', 'decamelize',
    'geckodriver', 'safaridriver', 'edgedriver', '@puppeteer/browsers', 'locate-app', 'wait-port',
    'lodash.isequal', '@wdio/repl', 'jszip'
]

const POLYFILLS = [
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`)
]
export function testrunner(options: WebdriverIO.BrowserRunnerOptions): Plugin[] {
    const browserModules = path.resolve(__dirname, 'browser')
    const automationProtocolPath = `/@fs${url.pathToFileURL(path.resolve(browserModules, 'driver.js')).pathname}`
    const mockModulePath = path.resolve(browserModules, 'mock.js')
    const setupModulePath = path.resolve(browserModules, 'setup.js')
    const spyModulePath = path.resolve(browserModules, 'spy.js')
    const wdioExpectModulePath = path.resolve(browserModules, 'expect.js')
    return [{
        name: 'wdio:testrunner',
        enforce: 'pre',
        resolveId: async (id) => {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId
            }

            if (POLYFILLS.includes(id)) {
                return polyfillPath(normalizeId(id.replace('/promises', '')))
            }

            /**
             * fake the content of this package and load the implementation of the mock
             * features from the browser module directory
             */
            if (id === '@wdio/browser-runner') {
                return spyModulePath
            }

            /**
             * allow to load the setup script from a script tag
             */
            if (id.endsWith('@wdio/browser-runner/setup')) {
                return setupModulePath
            }

            /**
             * run WebdriverIO assertions within the Node.js context so we can do things like
             * visual assertions or snapshot testing
             */
            if (id === 'expect-webdriverio') {
                return wdioExpectModulePath
            }

            /**
             * mock out imports that we can't transpile into browser land
             */
            if (MODULES_TO_MOCK.includes(id)) {
                return mockModulePath
            }

            /**
             * redirect requests to 3rd party dependencies
             */
            if (id.startsWith('/@wdio/browser-runner/third_party/')) {
                return path.resolve(__dirname, ...id.split('/').slice(3))
            }
        },
        load(id) {
            /**
             * provide a list of protocol commands to generate the prototype in the browser
             */
            if (id === resolvedVirtualModuleId) {
                return /*js*/`
                    import { fn } from '@wdio/browser-runner'
                    export const commands = ${JSON.stringify(protocolCommandList)}
                    export const automationProtocolPath = ${JSON.stringify(automationProtocolPath)}
                    export const wrappedFn = (...args) => fn()(...args)
                `
            }
        },
        transform(code, id) {
            if (id.includes('.vite/deps/expect.js')) {
                return {
                    code: code.replace(
                        'var fs = _interopRequireWildcard(require_graceful_fs());',
                        'var fs = {};'
                    ).replace(
                        'var expect_default = require_build11();',
                        'var expect_default = require_build11();\nwindow.expect = expect_default.default;'
                    ).replace(
                        'process.stdout.isTTY',
                        'false'
                    )
                }
            }
            return { code }
        },
        configureServer(server) {
            return () => {
                server.middlewares.use(async (req, res, next) => {
                    log.info(`Received request for: ${req.originalUrl}`)
                    /**
                     * don't return test page when sourcemaps are requested
                     */
                    if (!req.originalUrl || req.url?.endsWith('.map') || req.url?.endsWith('.wasm')) {
                        return next()
                    }

                    const cookies = ((req.headers.cookie && req.headers.cookie.split(';')) || []).map((c) => c.trim())
                    const urlParsed = url.parse(req.originalUrl)
                    const urlParamString = new URLSearchParams(urlParsed.query || '')
                    const cid = urlParamString.get('cid') || cookies.find((c) => c.includes('WDIO_CID'))?.split('=').pop()
                    const spec = urlParamString.get('spec') || cookies.find((c) => c.includes('WDIO_SPEC'))?.split('=').pop()
                    if (!cid || !SESSIONS.has(cid)) {
                        log.error(`No environment found for ${cid || 'non determined environment'}`)
                        return next()
                    }

                    if (!spec) {
                        log.error('No spec file was defined to run for this environment')
                        return next()
                    }

                    const env = SESSIONS.get(cid)!
                    try {
                        const template = await getTemplate(options, env, spec)
                        log.debug(`Render template for ${req.originalUrl}`)
                        res.end(await server.transformIndexHtml(`${req.originalUrl}`, template))
                    } catch (err) {
                        const template = getErrorTemplate(req.originalUrl, err as Error)
                        log.error(`Failed to render template: ${(err as Error).message}`)
                        res.end(await server.transformIndexHtml(`${req.originalUrl}`, template))
                    }

                    return next()
                })
            }
        }
    }, {
        name: 'modern-node-polyfills',
        async resolveId(id, _, ctx) {
            if (ctx.ssr || !builtinModules.includes(id)) {
                return
            }

            id = normalizeId(id)
            return { id: await polyfillPath(id), moduleSideEffects: false }
        },
    }]
}
