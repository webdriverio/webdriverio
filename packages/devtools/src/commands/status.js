/**
 * 
 * The Status command returns information about whether a remote end is in a state 
 * in which it can create new sessions and can additionally include arbitrary meta information
 * that is specific to the implementation.
 * 
 */

import path from 'path'

const puppeteerPath = require.resolve('puppeteer-core')
const puppeteerPkg = require(`${path.dirname(puppeteerPath)}/package.json`)

export default async function status () {
    return {
        message: '',
        ready: true,
        puppeteerVersion: puppeteerPkg.version
    }
}
