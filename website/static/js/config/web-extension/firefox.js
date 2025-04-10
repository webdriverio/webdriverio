import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { defineConfig } from '@wdio/config'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const extensionPath = path.resolve(__dirname, 'web-extension.xpi')

export const config = defineConfig({
    // ...
    before: async (capabilities) => {
        const browserName = capabilities.browserName
        if (browserName === 'firefox') {
            const extension = fs.readFileSync(extensionPath)
            await browser.installAddOn(extension.toString('base64'), true)
        }
    }
})