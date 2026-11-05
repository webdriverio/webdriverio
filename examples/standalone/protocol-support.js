import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { access, mkdtemp, rm } from 'node:fs/promises'
import { constants } from 'node:fs'
import { createServer } from 'node:net'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { parseArgs } from 'node:util'
import { remote, attach } from 'webdriverio'

/**
 * Run only with explicit, already installed binaries. This example never
 * downloads a driver or uses an existing browser profile or external page.
 */
const { values } = parseArgs({ options: {
    chrome: { type: 'string' },
    driver: { type: 'string' },
    'profile-root': { type: 'string' }
} })
for (const name of ['chrome', 'driver', 'profile-root']) {
    assert.ok(values[name] && path.isAbsolute(values[name]), `--${name} must be an absolute path`)
}
await access(values.chrome, constants.X_OK)
await access(values.driver, constants.X_OK)
await access(values['profile-root'], constants.W_OK)

const profile = await mkdtemp(path.join(values['profile-root'], 'wdio-protocol-support-'))
let driver
let driverClosed = false
let driverClose
let browser
try {
    const reservation = createServer()
    reservation.listen(0, '127.0.0.1')
    await once(reservation, 'listening')
    const { port } = reservation.address()
    await new Promise((resolve, reject) => reservation.close((error) => error ? reject(error) : resolve()))

    driver = spawn(values.driver, [`--port=${port}`, '--allowed-ips=127.0.0.1'], { stdio: 'inherit' })
    driverClose = new Promise((resolve) => driver.once('close', () => { driverClosed = true; resolve() }))
    let spawnError
    driver.once('error', (error) => { spawnError = error })
    const deadline = Date.now() + 10000
    let ready = false
    while (Date.now() < deadline) {
        if (spawnError) {
            throw spawnError
        }
        assert.equal(driver.exitCode, null, 'ChromeDriver exited before it became ready')
        try {
            const response = await fetch(`http://127.0.0.1:${port}/status`, { signal: AbortSignal.timeout(500) })
            ready = response.ok && (await response.json()).value.ready === true
        } catch {
            // The owned process may not yet have opened its loopback listener.
        }
        if (ready) {
            break
        }
        await delay(100)
    }
    assert.ok(ready, 'ChromeDriver did not become ready within 10 seconds')

    browser = await remote({
        hostname: '127.0.0.1', port, path: '/', logLevel: 'error',
        capabilities: {
            browserName: 'chrome',
            'wdio:enforceWebDriverClassic': true,
            'goog:chromeOptions': {
                binary: values.chrome,
                args: ['--headless=new', '--no-first-run', '--no-default-browser-check',
                    '--disable-background-networking', '--disable-component-update', `--user-data-dir=${profile}`]
            }
        }
    })
    await browser.url('data:text/html,<title>Protocol support example</title><p>Owned synthetic page</p>')
    assert.equal(await browser.getTitle(), 'Protocol support example')

    const attached = await attach({
        sessionId: browser.sessionId,
        capabilities: browser.capabilities,
        options: { hostname: '127.0.0.1', port, path: '/', logLevel: 'error' }
    })
    for (const client of [browser, attached]) {
        assert.equal(await client.getTitle(), 'Protocol support example')
        const version = await client.sendCommandAndGetResult('Browser.getVersion', {})
        assert.match(version.product, /Chrome\//)

        const requests = []
        client.on('request.start', (request) => requests.push(request))
        assert.equal(typeof client.getMozContext, 'function')
        await assert.rejects(client.getMozContext(), /getMozContext.*not supported.*Gecko/)
        client.overwriteCommand('getMozContext', async () => 'custom context')
        assert.equal(await client.getMozContext(), 'custom context')
        assert.equal(requests.length, 0, 'Unsupported and custom commands must not send a request')
    }
    console.log('PASS: remote and attach preserve Chrome commands; unsupported and custom commands send no requests')
} finally {
    try {
        if (browser) {
            await browser.deleteSession()
        }
    } finally {
        if (driver?.pid && !driverClosed) {
            driver.kill('SIGTERM')
            if (!await Promise.race([driverClose.then(() => true), delay(3000).then(() => false)])) {
                driver.kill('SIGKILL')
                await driverClose
            }
        }
        await rm(profile, { recursive: true, force: true })
    }
}
