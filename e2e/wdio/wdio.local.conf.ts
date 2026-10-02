import fs from 'node:fs'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const isLinux = os.platform() === 'linux'
const isApple = os.platform() === 'darwin'
const isWindows = os.platform() === 'win32'

/**
 * Pick browsers with `WDIO_E2E_BROWSERS`, e.g. `WDIO_E2E_BROWSERS=chrome,firefox`.
 *
 * Without it, a local run leaves out browsers that can't start on this
 * machine instead of aborting the whole run: Edge when it isn't installed,
 * and Safari, which needs "Allow remote automation" in its settings. Chrome,
 * Chromium and Firefox are downloaded when missing. CI runs every browser, so
 * a missing one still fails there.
 */
const requestedBrowsers = process.env.WDIO_E2E_BROWSERS
    ?.split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean)

function isEdgeInstalled () {
    if (isApple) {
        return fs.existsSync('/Applications/Microsoft Edge.app')
    }
    if (isWindows) {
        return [process.env['PROGRAMFILES(X86)'], process.env.PROGRAMFILES]
            .filter((dir): dir is string => Boolean(dir))
            .some((dir) => fs.existsSync(path.join(dir, 'Microsoft', 'Edge', 'Application', 'msedge.exe')))
    }
    return ['microsoft-edge', 'microsoft-edge-stable'].some((bin) => spawnSync('which', [bin]).status === 0)
}

function canRunLocally (browserName: string) {
    if (browserName === 'edge') {
        return isEdgeInstalled()
    }
    return browserName !== 'safari'
}

function selectBrowsers (capabilities: WebdriverIO.Capabilities[]) {
    const selected = capabilities.filter((cap) => {
        const name = (cap.browserName ?? '').toLowerCase()
        if (requestedBrowsers) {
            return requestedBrowsers.includes(name)
        }
        return Boolean(process.env.CI) || canRunLocally(name)
    })
    const skipped = capabilities.filter((cap) => !selected.includes(cap)).map((cap) => cap.browserName)
    if (skipped.length) {
        console.log(`Skipping ${skipped.join(', ')} (set WDIO_E2E_BROWSERS to choose browsers)`)
    }
    return selected
}

/**
 * Chrome and Edge implement `webExtension.install` only when these arguments
 * are set. `--remote-debugging-pipe` needs its own user-data-dir from Chrome 136.
 * Each capability gets a directory so parallel browsers do not share a profile.
 * The directories are removed when this process finishes.
 */
const profileDirs: string[] = []

function removeProfileDirs () {
    for (const dir of profileDirs.splice(0)) {
        try {
            /**
             * Windows keeps the profile locked until the browser process
             * finishes. A throw here becomes the run's exit code.
             */
            fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
        } catch {
            // leftover profiles are temporary directories
        }
    }
}

process.on('exit', removeProfileDirs)

function chromiumExtensionArgs (browser: string) {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), `wdio-${browser}-`))
    profileDirs.push(userDataDir)
    return [
        '--enable-unsafe-extension-debugging',
        '--remote-debugging-pipe',
        `--user-data-dir=${userDataDir}`
    ]
}

/**
 * with this config file we verify that the `webdriverio` package can spin
 * up the necessary browser runner without needing a service anymore.
 */
export const config: WebdriverIO.Config = {

    /**
     * specify test files
     */
    specs: [[
        path.join(__dirname, 'headless', 'launch.e2e.ts'),
        path.join(__dirname, 'headless', 'bidi.e2e.ts'),
        path.join(__dirname, 'headless', 'setFiles.e2e.ts'),
        path.join(__dirname, 'headless', 'browsingContexts.e2e.ts')
    ],
    /**
     * Runs in a session of its own: once a session removed an intercept,
     * Chromium can stall a later intercepted request in the `responseStarted`
     * phase, which the mocks of the group above would trigger.
     */
    path.join(__dirname, 'headless', 'mocking.e2e.ts')
    ],

    /**
     * capabilities
     */
    capabilities: selectBrowsers([
        {
            browserName: 'chrome',
            webSocketUrl: true,
            'goog:chromeOptions': {
                args: ['headless', 'disable-gpu',
                    // Having `WebDriverError: session not created: Chrome instance exited` since ubuntu 22.04 to 24.04, since the below is no more wrapped by default.
                    // See https://github.com/webdriverio/webdriverio/issues/14168.
                    ...(isLinux ? ['no-sandbox'] : []),
                    ...chromiumExtensionArgs('chrome')
                ]
            }
        },
        {
            browserName: 'firefox',
            webSocketUrl: true,
            'moz:firefoxOptions': {
                args: ['-headless']
            }
        },
        {
            browserName: 'edge',
            webSocketUrl: true,
            'ms:edgeOptions': {
                args: [
                    'headless',
                    'disable-gpu',
                    // Having `WebDriverError: session not created: Chrome instance exited` since ubuntu 22.04 to 24.04, since the below is no more wrapped by default.
                    // See https://github.com/webdriverio/webdriverio/issues/14168.
                    ...(isLinux ? ['no-sandbox'] : []),
                    ...chromiumExtensionArgs('edge')
                ]
            },
        },
        // Excluding Chromium on Windows due to `Error: chromium is not available on Windows.`
        ...(!isWindows ? [{
            browserName: 'chromium',
            webSocketUrl: true,
            'goog:chromeOptions': {
                args: [
                    'headless',
                    'disable-gpu',
                    // `no-sandbox` is required on Linux since Ubuntu 22.04→24.04 (seccomp/user-namespace sandbox no longer
                    // provided by default — see https://github.com/webdriverio/webdriverio/issues/14168) and on macOS in
                    // CI/sandboxed environments where Chrome's user-namespace sandboxing is also unavailable.
                    ...(isLinux || isApple ? ['no-sandbox'] : []),
                    ...chromiumExtensionArgs('chromium')
                ]
            }
        }] : []),
        ...(isApple ? [{
            // Not yet supported, safari use classic WebDriver for now.
            // webSocketUrl: true,
            browserName: 'safari'
        }] : [])
    ]),

    /**
     * test configurations
     */
    logLevel: 'info',
    framework: 'mocha',
    outputDir: __dirname,
    reporters: ['spec'],
    specFileRetries: 3,

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },

    /**
     * Remove Chromium profiles after the browsers have exited. `process.exit`
     * also removes profiles created when a worker loads this file.
     */
    onComplete () {
        removeProfileDirs()
    }
}
