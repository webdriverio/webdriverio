import https from 'node:https'

import logger from '@wdio/logger'
import { resolve as resolveModule } from 'import-meta-resolve'

import { installCommand } from './optionalDependency.js'

const log = logger('@wdio/utils')
const PROXY_VARIABLES = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy']

let warned = false

/**
 * `@puppeteer/browsers` downloads browsers and Chromedriver through a proxy
 * only when `proxy-agent` is installed or when Node.js' built-in proxy support
 * is on. `proxy-agent` is an optional peer dependency that WebdriverIO does not
 * install, because its dependency tree carries advisories that have no fix.
 * Warn once when a proxy is configured but the download would ignore it.
 */
export function warnIfDownloadProxyIgnored () {
    if (warned) {
        return
    }

    const variable = PROXY_VARIABLES.find((name) => process.env[name])
    if (!variable || hasBuiltInProxy() || canLoadProxyAgent()) {
        return
    }

    warned = true
    log.warn(
        `${variable} is set, but browser and Chromedriver downloads ignore it. ` +
        `Install "proxy-agent" (${installCommand('proxy-agent', { dev: true })}) or run Node.js with ` +
        'NODE_USE_ENV_PROXY=1 (Node.js 22.21.0 / 24.5.0 or later). See https://webdriver.io/docs/proxy'
    )
}

/**
 * `NODE_USE_ENV_PROXY=1` and `--use-env-proxy` give the global agent a `proxyEnv`
 */
function hasBuiltInProxy () {
    return Boolean((https.globalAgent as { options?: { proxyEnv?: unknown } }).options?.proxyEnv)
}

/**
 * resolve `proxy-agent` from `@puppeteer/browsers`, which imports it
 */
function canLoadProxyAgent () {
    try {
        resolveModule('proxy-agent', resolveModule('@puppeteer/browsers', import.meta.url))
        return true
    } catch {
        return false
    }
}
