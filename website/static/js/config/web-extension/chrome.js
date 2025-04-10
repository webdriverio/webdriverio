import path from 'node:path'
import url from 'node:url'
import { defineConfig } from '@wdio/config'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const config = defineConfig({
    // ...
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            // given your wdio.conf.js is in the root directory and your compiled
            // web extension files are located in the `./dist` folder
            args: [`--load-extension=${path.join(__dirname, '..', '..', 'dist')}`]
        }
    }]
})