import url from 'node:url'
import path from 'node:path'
import { builtinModules } from 'node:module'

import logger from '@wdio/logger'
import { polyfillPath } from 'modern-node-polyfills'
import { deepmerge } from 'deepmerge-ts'
import { resolve } from 'import-meta-resolve'

import type { Plugin } from 'vite'
import {
    WebDriverProtocol, MJsonWProtocol, JsonWProtocol, AppiumProtocol,
    ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol, GeckoProtocol,
    WebDriverBidiProtocol
} from '@wdio/protocols'

import { SESSIONS } from '../../constants.js'
import { getTemplate, getErrorTemplate, normalizeId } from '../utils.js'

const log = logger('@wdio/browser-runner:plugin')
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const commands = deepmerge(
    WebDriverProtocol, MJsonWProtocol, JsonWProtocol, AppiumProtocol,
    ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol, GeckoProtocol,
    WebDriverBidiProtocol
)
const protocolCommandList = Object.values(commands).map(
    (endpoint) => Object.values(endpoint).map(
        ({ command }) => command
    )
).flat()
const WDIO_PACKAGES = ['webdriverio', 'expect-webdriverio']
const virtualModuleId = 'virtual:wdio'
const resolvedVirtualModuleId = '\0' + virtualModuleId

const MODULES_TO_MOCK = ['import-meta-resolve', 'puppeteer-core', 'archiver', 'glob', 'devtools', 'ws']
const FETCH_FROM_ESM = ['mocha']

const POLYFILLS = [
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`)
].map((m) => m.replace('/promises', ''))

export function testrunner(options: WebdriverIO.BrowserRunnerOptions): Plugin[] {
    const automationProtocolPath = `/@fs${url.pathToFileURL(path.resolve(__dirname, '..', '..', 'browser', 'driver.js')).pathname}`
    const mockModulePath = path.resolve(__dirname, '..', '..', 'browser', 'mock.js')
    const setupModulePath = path.resolve(__dirname, '..', '..', 'browser', 'setup.js')
    const spyModulePath = path.resolve(__dirname, '..', '..', 'browser', 'spy.js')
    return [{
        name: 'wdio:testrunner',
        enforce: 'pre',
        resolveId: async (id) => {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId
            }

            if (POLYFILLS.includes(id)) {
                return polyfillPath(normalizeId(id))
            }

            if (id === '@wdio/browser-runner') {
                return spyModulePath
            }

            if (id.endsWith('@wdio/browser-runner/setup')) {
                return setupModulePath
            }

            /**
             * make sure WDIO imports are resolved properly as ESM module
             */
            if (id.startsWith('@wdio') || WDIO_PACKAGES.includes(id)) {
                return url.fileURLToPath(await resolve(id, import.meta.url))
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
        configureServer(server) {
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
                        const template = getErrorTemplate(req.url, err)
                        log.error(`Failed to render template: ${err.message}`)
                        res.end(await server.transformIndexHtml(`${req.url}`, template))
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
