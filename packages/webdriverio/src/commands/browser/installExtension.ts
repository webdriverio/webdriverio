import type { remote } from 'webdriver'

import { environment } from '../../environment.js'
import { annotateWebExtensionError } from '../../utils/webExtension.js'

/**
 * Same hosts `wdio session` treats as a local browser in
 * `packages/wdio-session/src/actions/interact.ts`.
 */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

/**
 * Install a web extension in the current WebDriver BiDi session and return its id.
 *
 * Pass a path to an unpacked extension directory, a path to a `.zip`, `.xpi`, or `.crx`
 * archive, or archive bytes you already have:
 *
 * <example>
    :installExtension.js
    import fs from 'node:fs'

    const id = await browser.installExtension('./dist')
    const idFromArchive = await browser.installExtension('./ext.zip')
    const base64 = fs.readFileSync('./ext.zip').toString('base64')
    const idFromBytes = await browser.installExtension({ base64 })
    await browser.uninstallExtension(id)
 * </example>
 *
 * A string path is resolved with `path.resolve` before it is sent.
 *
 * - A directory becomes `{ type: 'path', path }`. The browser must be able to read that directory.
 * - A path ending in `.zip`, `.xpi`, or `.crx` becomes `{ type: 'archivePath', path }`.
 * - `{ base64: string }` becomes `{ type: 'base64', value }`. Any other object is rejected.
 *
 * On a remote session (a hostname other than `localhost`, `127.0.0.1`, or `::1`, or a
 * cloud `user` and `key`) a path on the test runner is not a path on the browser machine.
 * The command reads an archive, or zips a directory in memory, and sends
 * `{ type: 'base64', value }`. Callers do not branch on that.
 *
 * Local sessions send `path` or `archivePath` and do not read the file bytes.
 *
 * The session must speak WebDriver BiDi ([`webExtension.install`](https://w3c.github.io/webdriver-bidi/#command-webExtension-install)).
 * A classic session throws. Safari has no BiDi session, so this command does not cover Safari.
 * A browser that does not implement the module returns `unsupported operation`.
 * A bad archive returns `invalid web extension`.
 *
 * Chrome and Edge leave this command disabled until the session is started with
 * `--enable-unsafe-extension-debugging` and `--remote-debugging-pipe`. Without
 * those arguments the driver returns `unknown error - Method not available`.
 * Chrome 136 and newer also require `--user-data-dir` when `--remote-debugging-pipe` is set.
 * Firefox does not need these arguments.
 *
 * This installs an extension in the middle of a session. To load an extension before the
 * first navigation, keep using `goog:chromeOptions` or Firefox [`installAddOn`](/docs/api/gecko#installaddon).
 * [`browser.webExtensionInstall`](/docs/api/webdriverBidi) remains available when you want the spec payload.
 *
 * Point a directory argument at the extension root (the folder that contains `manifest.json`).
 * Path arguments run in Node. In the browser runner, pass `{ base64 }` instead.
 *
 * @alias browser.installExtension
 * @param {string|object} extension unpacked directory, `.zip` / `.xpi` / `.crx` path, or `{ base64: string }`
 * @return {String} extension id
 * @type utility
 * @uses protocol/webExtensionInstall
 */
export async function installExtension (
    this: WebdriverIO.Browser,
    extension: string | { base64: string }
): Promise<string> {
    if (!this.isBidi) {
        throw new Error('installExtension requires a WebDriver BiDi session (webExtension.install)')
    }

    const extensionData = await extensionDataFor.call(this, extension)
    let result: Awaited<ReturnType<WebdriverIO.Browser['webExtensionInstall']>>
    try {
        result = await this.webExtensionInstall({ extensionData })
    } catch (err) {
        throw annotateWebExtensionError(err, 'webExtension.install')
    }
    const id = result?.extension
    if (typeof id !== 'string' || id.length === 0) {
        throw new Error('webExtension.install did not return an extension id')
    }
    return id
}

async function extensionDataFor (
    this: WebdriverIO.Browser,
    extension: string | { base64: string }
): Promise<remote.WebExtensionExtensionData> {
    if (isBase64Payload(extension)) {
        return { type: 'base64', value: extension.base64 }
    }
    if (typeof extension !== 'string') {
        throw new Error('installExtension expects a path string or { base64: string }')
    }

    return environment.value.extensionDataFromPath(extension, isRemoteSession(this))
}

function isBase64Payload (value: unknown): value is { base64: string } {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return false
    }
    const record = value as Record<string, unknown>
    return Object.keys(record).length === 1 && typeof record.base64 === 'string'
}

/**
 * A cloud `user` and `key`, or a hostname outside the local set, means the
 * browser does not share this machine's disk. Matches `isRemote` in
 * `packages/wdio-session/src/actions/interact.ts`.
 */
function isRemoteSession (browser: WebdriverIO.Browser) {
    const { hostname, user, key } = browser.options
    if (typeof user === 'string' && user.length > 0 && typeof key === 'string' && key.length > 0) {
        return true
    }
    return typeof hostname === 'string' && hostname.length > 0 && !LOCAL_HOSTS.has(hostname.toLowerCase())
}
