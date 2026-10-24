import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { browser } from '@wdio/globals'
import { ReportEvents } from '@wdio/html-reporter'

/**
 * Report events of the parallel run. Each log and screenshot file name starts with the
 * tag (`T1`, `S1`…) of the test that sends it, so `checkParallel.mjs` can tell when
 * the report shows an event under another test.
 */
const events = new ReportEvents()

export const log = (text: string) => events.logMessage(text)

export const page = (color: string) => browser.url(`${process.env.HTML_COLOR_ORIGIN}/${color}`)

/**
 * logs the md5 of the screenshot: the file that `useOnAfterCommandForScreenshot` writes
 * for this command must be under the same test
 */
export async function snap (tag: string) {
    const data = await browser.takeScreenshot()
    log(`${tag}:md5:${crypto.createHash('md5').update(Buffer.from(data, 'base64')).digest('hex')}`)
    return data
}

/**
 * write the file of the `snap()` capture, so its logged md5 is the md5 of this file
 */
export async function logScreenshot (tag: string) {
    const file = path.join(process.env.HTML_SHOTS_DIR!, `${tag}-${crypto.randomUUID()}.png`)
    fs.writeFileSync(file, await snap(tag), 'base64')
    events.logScreenshot(file)
}
