import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { defineConfig } from '@wdio/config'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const extPath = path.join(__dirname, 'web-extension-chrome.crx')
const chromeExtension = fs.readFileSync(extPath).toString('base64')

export const config = defineConfig({
    // ...
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            extensions: [chromeExtension]
        }
    }]
})