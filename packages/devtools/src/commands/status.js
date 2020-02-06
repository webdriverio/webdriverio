import path from 'path'

const puppeteerPath = require.resolve('puppeteer-core')
const puppeteerPkg = require(`${path.dirname(puppeteerPath)}/package.json`)

let puppeteerFirefoxPath
let puppeteerFirefoxPkg

try {
    puppeteerFirefoxPath = require.resolve('puppeteer-firefox')
} catch (error) {
    /*
     * puppeteer-firefox is an optional dependency and we expect to ignore
     * an error from require.resolve if it's not installed
     */
}

// Only require puppeteer-firefox package.json if it's installed
puppeteerFirefoxPkg = (puppeteerFirefoxPath) ?
    require(`${path.dirname(puppeteerFirefoxPath)}/package.json`) :
    {}

export default async function status () {
    return {
        message: '',
        ready: true,
        puppeteerVersion: puppeteerPkg.version,
        puppeteerFirefoxVersion: puppeteerFirefoxPkg.version
    }
}
