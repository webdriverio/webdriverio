import path from 'path'

const puppeteerPath = require.resolve('puppeteer-core')
const puppeteerPkg = require(`${path.dirname(puppeteerPath)}/package.json`)
const puppeteerFirefoxPath = require.resolve('puppeteer-firefox')
const puppeteerFirefoxPkg = require(`${path.dirname(puppeteerFirefoxPath)}/package.json`)

export default async function navigateTo () {
    return {
        value: {
            message: '',
            ready: true,
            puppeteerVersion: puppeteerPkg.version,
            puppeteerFirefoxVersion: puppeteerFirefoxPkg.version
        }
    }
}
