import url from 'node:url'
import logger from '@wdio/logger'

import type { Plugin } from 'vite'

import { SESSIONS } from '../constants.js'
import { getTemplate } from '../utils.js'

const log = logger('@wdio/browser-runner:plugin')

export function testrunner (): Plugin {
    return {
        name: 'wdio:testrunner',
        enforce: 'pre',
        configureServer (server) {
            return () => {
                server.middlewares.use('/', async (req, res, next) => {
                    log.info(`Received request for: ${req.url}`)
                    if (!req.url) {
                        return next()
                    }

                    const urlParsed = url.parse(req.url)
                    // if request is not html , directly return next()
                    if (!urlParsed.pathname || !urlParsed.path || !urlParsed.pathname.endsWith('.html')) {
                        return next()
                    }

                    const urlParamString = new URLSearchParams(urlParsed.query || '')
                    const cid = urlParamString.get('cid')
                    if (!cid || !SESSIONS.has(cid)) {
                        log.error(`No environment found for ${cid || 'non determined environment'}`)
                        return next()
                    }

                    const env = SESSIONS.get(cid)!
                    const template = getTemplate(cid, env)
                    log.debug(`Render template: ${template}`)
                    res.end(await server.transformIndexHtml(`${req.url}`, template))
                    return next()
                })
            }
        }
    }
}
