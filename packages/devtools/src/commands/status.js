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
