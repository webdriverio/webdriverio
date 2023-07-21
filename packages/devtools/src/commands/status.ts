import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import { resolve } from 'import-meta-resolve'

let puppeteerVersion: string

/**
 * The Status command returns information about whether a remote end is in a state
 * in which it can create new sessions and can additionally include arbitrary meta information
 * that is specific to the implementation.
 *
 * @alias browser.status
 * @see https://w3c.github.io/webdriver/#dfn-status
 * @return {Object} returning an object with the Puppeteer version being used
 */
export default async function status () {
    if (!puppeteerVersion) {
        const puppeteerPath = await resolve('puppeteer-core', import.meta.url)
        try {
            const pkgJsonPath = path.resolve(url.fileURLToPath(puppeteerPath), '..', '..', '..', '..', 'package.json')
            const pkgJson = JSON.parse((await fs.readFile(pkgJsonPath, 'utf-8')).toString())
            puppeteerVersion = pkgJson.version
        } catch (err) {
            // ignore
        }
    }

    return {
        message: '',
        ready: true,
        puppeteerVersion
    }
}
