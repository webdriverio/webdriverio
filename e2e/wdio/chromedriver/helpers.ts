import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { browser, $, expect } from '@wdio/globals'

export const cacheDir = path.join(os.tmpdir(), 'wdio-chromedriver')

export const driverDirs = () => fs.readdirSync(path.join(cacheDir, 'chromedriver'))

/**
 * drives a page and returns the version of Chromedriver used
 */
export async function driveAndGetChromedriverVersion () {
    await browser.url('data:text/html,<p id="p">hello</p>')
    await expect($('#p')).toHaveText('hello')
    return (browser.capabilities as WebdriverIO.Capabilities & { chrome?: { chromedriverVersion?: string } }).chrome?.chromedriverVersion
}
