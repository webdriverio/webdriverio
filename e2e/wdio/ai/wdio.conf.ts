import url from 'node:url'
import path from 'node:path'

import { actModel, cacheDir } from './model.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config: WebdriverIO.Config = {
    specs: [path.join(__dirname, '*.e2e.ts')],
    capabilities: [{
        browserName: 'chrome',
        webSocketUrl: true,
        'goog:chromeOptions': { args: ['headless', 'disable-gpu'] }
    }],
    services: [['ai', { model: actModel, cache: 'off', cacheDir, workspace: { dir: path.join(cacheDir, 'workspaces') } }]],
    logLevel: 'warn',
    framework: 'mocha',
    reporters: ['spec'],
    outputDir: __dirname,
    mochaOpts: { ui: 'bdd', timeout: 60000 }
}
