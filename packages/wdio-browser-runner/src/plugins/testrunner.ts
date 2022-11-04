import url from 'node:url'
import path from 'node:path'

import logger from '@wdio/logger'
import { createRequire } from 'node:module'

import type { Plugin } from 'vite'
import {
    WebDriverProtocol, MJsonWProtocol, JsonWProtocol, AppiumProtocol,
    ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol, GeckoProtocol,
    WebDriverBidiProtocol
} from '@wdio/protocols'

import { SESSIONS } from '../constants.js'
import { getTemplate, getErrorTemplate } from '../utils.js'

const log = logger('@wdio/browser-runner:plugin')
const require = createRequire(import.meta.url)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const commands = {
    ...WebDriverProtocol,
    ...MJsonWProtocol,
    ...JsonWProtocol,
    ...AppiumProtocol,
    ...ChromiumProtocol,
    ...SauceLabsProtocol,
    ...SeleniumProtocol,
    ...GeckoProtocol,
    ...WebDriverBidiProtocol
}
const protocolCommandList = Object.values(commands).map(
    (endpoint) => Object.values(endpoint).map(
        ({ command }) => command
    )
).flat()
const WDIO_PACKAGES = ['webdriverio', 'expect-webdriverio']
const virtualModuleId = 'virtual:wdio'
const resolvedVirtualModuleId = '\0' + virtualModuleId

const MODULES_TO_MOCK = [
    'node:module', 'node:events', 'node:path', 'node:url', 'puppeteer-core', 'archiver',
    'query-selector-shadow-dom/plugins/puppeteer/index.js',
    'query-selector-shadow-dom/plugins/webdriverio/index.js',
    'glob', 'devtools'
]

const FETCH_FROM_ESM = [
    'serialize-error', 'minimatch', 'css-shorthand-properties', 'lodash.merge', 'lodash.zip',
    'lodash.clonedeep', 'lodash.pickby', 'lodash.flattendeep', 'aria-query', 'grapheme-splitter',
    'css-value', 'rgb2hex', 'p-iteration'
]

export function testrunner (options: WebdriverIO.BrowserRunnerOptions): Plugin {
    const automationProtocolPath = path.resolve(__dirname, '..', 'browser', 'driver.js')
    const mockModulePath = path.resolve(__dirname, '..', 'browser', 'mock.js')
    const setupModulePath = path.resolve(__dirname, '..', 'browser', 'setup.js')
    const reporterPath = path.resolve(__dirname, '..', 'browser', 'reporter.js')
    return {
        name: 'wdio:testrunner',
        enforce: 'pre',
        resolveId: (id) => {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId
            }

            if (id === '@wdio/browser-runner/setup') {
                return setupModulePath
            }

            if (id === '@wdio/browser-runner/reporter') {
                return reporterPath
            }

            /**
             * make sure WDIO imports are resolved properly as ESM module
             */
            if (id.startsWith('@wdio') || WDIO_PACKAGES.includes(id)) {
                return require.resolve(id).replace('/cjs', '')
            }

            /**
             * mock out imports that we can't transpile into browser land
             */
            if (MODULES_TO_MOCK.includes(id)) {
                return mockModulePath
            }

            /**
             * some dependencies used by WebdriverIO packages are still using CJS
             * so we need to pull them from esm.sh to have them run in the browser
             */
            if (FETCH_FROM_ESM.includes(id)) {
                return `https://esm.sh/${id}`
            }
        },
        load(id) {
            /**
             * provide a list of protocol commands to generate the prototype in the browser
             */
            if (id === resolvedVirtualModuleId) {
                return /*js*/`
                    export const commands = ${JSON.stringify(protocolCommandList)}
                    export const automationProtocolPath = ${JSON.stringify(automationProtocolPath)}
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
        configureServer (server) {
            return () => {
                server.middlewares.use('/', async (req, res, next) => {
                    log.info(`Received request for: ${req.url}`)
                    if (!req.url) {
                        return next()
                    }

                    const urlParsed = url.parse(req.url)
                    // if request is not html , directly return next()
                    if (!urlParsed.pathname || !urlParsed.path || !urlParsed.pathname.endsWith('test.html')) {
                        return next()
                    }

                    const urlParamString = new URLSearchParams(urlParsed.query || '')
                    const [cid] = urlParsed.pathname.slice(1).split('/')
                    const spec = urlParamString.get('spec')
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
                        log.debug(`Render template for ${req.url}`)
                        res.end(await server.transformIndexHtml(`${req.url}`, template))
                    } catch (err: any) {
                        const template = await getErrorTemplate(req.url, err)
                        log.error(`Failed to render template: ${err.message}`)
                        res.end(await server.transformIndexHtml(`${req.url}`, template))
                    }

                    return next()
                })
            }
        }
    }
}
