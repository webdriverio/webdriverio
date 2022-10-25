import url from 'node:url'
import path from 'node:path'
import logger from '@wdio/logger'
import { createRequire } from 'node:module'

import type { Plugin } from 'vite'

import { SESSIONS } from '../constants.js'
import { getTemplate, getErrorTemplate } from '../utils.js'

const log = logger('@wdio/browser-runner:plugin')
const require = createRequire(import.meta.url)

export function testrunner (options: WebdriverIO.BrowserRunnerOptions): Plugin {
    const root = options.rootDir || process.cwd()
    return {
        name: 'wdio:testrunner',
        enforce: 'pre',
        resolveId: (id) => {
            /**
             * make sure WDIO imports are resolved properly
             */
            if (id.startsWith('@wdio')) {
                return require.resolve(id)
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
                    const cid = urlParamString.get('cid')
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
                        const template = await getTemplate(options, env, path.join(root, spec))
                        log.debug(`Render template: ${template}`)
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
