/**
 * Debug probe: Firefox on Windows does not answer `network.getData` for the
 * body of https://guinea-pig.webdriver.io/ (the "should be able to see the
 * response body" e2e test). This script sends the same BiDi commands as
 * `browser.mock()` + `mock.waitForResponse()`, with and without the
 * intercept, and records which `getData` calls get no reply.
 *
 * Not for merge. Env:
 *   PROBE_OUT         folder for the logs and summary (default: e2e/debug/out)
 *   PROBE_MODES       comma list of modes (default: all)
 *   PROBE_ITERATIONS  navigations per mode (default: 5)
 */
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { remote } from '../../packages/webdriverio/build/index.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const OUT = path.resolve(process.env.PROBE_OUT || path.join(__dirname, 'out'))
const TARGET = 'https://guinea-pig.webdriver.io/'
const ITERATIONS = Number(process.env.PROBE_ITERATIONS || 5)
const GET_DATA_WAIT = 10_000
const EVENT_WAIT = 15_000

/**
 * intercept: the phases to block, like `browser.mock()` does
 * cache: `network.setCacheBehavior` value
 */
const MODES = {
    'intercept-both': { phases: ['beforeRequestSent', 'responseStarted'], cache: 'default' },
    'no-intercept': { phases: [], cache: 'default' },
    'intercept-request': { phases: ['beforeRequestSent'], cache: 'default' },
    'intercept-response': { phases: ['responseStarted'], cache: 'default' },
    'intercept-both-bypass-cache': { phases: ['beforeRequestSent', 'responseStarted'], cache: 'bypass' },
}

const selectedModes = (process.env.PROBE_MODES || Object.keys(MODES).join(','))
    .split(',').map((m) => m.trim()).filter(Boolean)

fs.mkdirSync(OUT, { recursive: true })

const log = (...args) => console.log(new Date().toISOString(), ...args)

/**
 * Race a BiDi command against a timer. The command promise keeps running
 * (the BiDi client rejects it after `bidiResponseTimeout`), so catch it to
 * avoid an unhandled rejection.
 */
async function timed (promise, ms) {
    const start = Date.now()
    promise.catch(() => {})
    let timer
    const timeout = new Promise((resolve) => {
        timer = setTimeout(() => resolve({ status: 'no-reply' }), ms)
    })
    const result = await Promise.race([
        promise.then(
            (value) => ({ status: 'ok', value }),
            (err) => ({ status: 'error', error: err.message.split('\n')[0] })
        ),
        timeout
    ])
    clearTimeout(timer)
    return { ...result, ms: Date.now() - start }
}

function pickResponse (response) {
    if (!response) {
        return undefined
    }
    const header = (name) => response.headers
        ?.find((h) => h.name.toLowerCase() === name)?.value?.value
    return {
        status: response.status,
        fromCache: response.fromCache,
        protocol: response.protocol,
        mimeType: response.mimeType,
        bytesReceived: response.bytesReceived,
        headersSize: response.headersSize,
        bodySize: response.bodySize,
        contentSize: response.content?.size,
        contentEncoding: header('content-encoding'),
        contentLength: header('content-length'),
        xCache: header('x-cache'),
        cfPop: header('x-amz-cf-pop'),
        age: header('age'),
        altSvc: header('alt-svc'),
    }
}

async function runMode (name) {
    const mode = MODES[name]
    if (!mode) {
        throw new Error(`Unknown mode ${name}`)
    }
    log(`===== MODE ${name} =====`)
    const modeOut = path.join(OUT, name)
    fs.mkdirSync(modeOut, { recursive: true })

    const browser = await remote({
        logLevel: 'info',
        outputDir: modeOut,
        capabilities: {
            browserName: 'firefox',
            webSocketUrl: true,
            'moz:firefoxOptions': {
                args: ['-headless'],
                // geckodriver sets `remote.log.level` from this level: all BiDi packets go to the geckodriver log
                log: { level: 'trace' },
                prefs: { 'remote.log.truncate': false }
            }
        }
    })
    const caps = browser.capabilities
    log(`Firefox ${caps.browserVersion} on ${caps.platformName}`)

    const events = []
    const waiters = new Map()
    const record = (event, params) => {
        if (params.request?.url !== TARGET) {
            return
        }
        const entry = {
            event,
            at: new Date().toISOString(),
            request: params.request.request,
            navigation: params.navigation,
            context: params.context,
            isBlocked: params.isBlocked,
            intercepts: params.intercepts,
            redirectCount: params.redirectCount,
            acceptEncoding: params.request.headers
                ?.find((h) => h.name.toLowerCase() === 'accept-encoding')?.value?.value,
            errorText: params.errorText,
            response: pickResponse(params.response)
        }
        events.push(entry)
        log(`EVENT ${event} ${JSON.stringify(entry)}`)
        return entry
    }

    browser.on('network.beforeRequestSent', (params) => {
        if (!record('network.beforeRequestSent', params)) {
            return
        }
        if (params.isBlocked) {
            browser.networkContinueRequest({ request: params.request.request })
                .catch((err) => log(`continueRequest failed: ${err.message}`))
        }
    })
    browser.on('network.responseStarted', (params) => {
        if (!record('network.responseStarted', params)) {
            return
        }
        if (params.isBlocked) {
            browser.networkProvideResponse({ request: params.request.request })
                .catch((err) => log(`provideResponse failed: ${err.message}`))
        }
    })
    for (const event of ['network.responseCompleted', 'network.fetchError']) {
        browser.on(event, (params) => {
            const entry = record(event, params)
            if (entry) {
                waiters.get('done')?.(entry)
            }
        })
    }

    await browser.sessionSubscribe({
        events: ['network.beforeRequestSent', 'network.responseStarted', 'network.responseCompleted', 'network.fetchError']
    })
    await browser.networkAddDataCollector({ dataTypes: ['request', 'response'], maxEncodedDataSize: 10 * 1024 * 1024 })
    if (mode.cache !== 'default') {
        await browser.networkSetCacheBehavior({ cacheBehavior: mode.cache })
    }
    if (mode.phases.length) {
        await browser.networkAddIntercept({
            phases: mode.phases,
            urlPatterns: [{ type: 'pattern', protocol: 'https', hostname: 'guinea-pig.webdriver.io', pathname: '/', port: '443' }]
        })
    }

    const results = []
    for (let iteration = 1; iteration <= ITERATIONS; iteration++) {
        await browser.url('about:blank')
        const done = new Promise((resolve) => {
            const timer = setTimeout(() => resolve(undefined), EVENT_WAIT)
            waiters.set('done', (entry) => {
                clearTimeout(timer)
                waiters.delete('done')
                resolve(entry)
            })
        })
        await browser.url(TARGET)
        const completed = await done
        if (!completed || completed.event !== 'network.responseCompleted') {
            results.push({ mode: name, iteration, completed: completed?.event ?? 'none' })
            log(`RESULT ${JSON.stringify(results.at(-1))}`)
            continue
        }

        // same order as WebDriverInterception: request body first, then response body
        const requestData = await timed(browser.networkGetData({ request: completed.request, dataType: 'request' }), GET_DATA_WAIT)
        const responseData = await timed(browser.networkGetData({ request: completed.request, dataType: 'response' }), GET_DATA_WAIT)
        const body = responseData.value?.bytes?.value
        results.push({
            mode: name,
            iteration,
            request: completed.request,
            ...completed.response,
            requestData: requestData.status === 'error' ? `error (${requestData.ms}ms)` : `${requestData.status} (${requestData.ms}ms)`,
            responseData: responseData.status === 'ok'
                ? `ok ${body?.length ?? 0} chars, title=${String(body).includes('<title>WebdriverJS Testpage</title>')} (${responseData.ms}ms)`
                : `${responseData.status}${responseData.error ? ` ${responseData.error}` : ''} (${responseData.ms}ms)`
        })
        log(`RESULT ${JSON.stringify(results.at(-1))}`)
    }

    fs.writeFileSync(path.join(modeOut, 'events.json'), JSON.stringify(events, null, 2))
    await browser.deleteSession().catch((err) => log(`deleteSession failed: ${err.message}`))
    return results
}

const all = []
for (const name of selectedModes) {
    try {
        all.push(...await runMode(name))
    } catch (err) {
        log(`MODE ${name} failed: ${err.stack}`)
        all.push({ mode: name, failed: err.message })
    }
}

fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(all, null, 2))
console.log('\n===== SUMMARY =====')
console.table(all.map(({ mode, iteration, status, fromCache, protocol, contentEncoding, cfPop, requestData, responseData, completed, failed }) =>
    ({ mode, iteration, status, fromCache, protocol, contentEncoding, cfPop, requestData, responseData, completed, failed })))
const hung = all.filter((r) => r.responseData?.startsWith('no-reply'))
console.log(hung.length
    ? `REPRODUCED: ${hung.length} response getData call(s) got no reply in ${GET_DATA_WAIT}ms`
    : 'NOT REPRODUCED: every response getData call got a reply')
process.exit(0)
