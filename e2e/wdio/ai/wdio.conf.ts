import url from 'node:url'
import path from 'node:path'

import { actModel, cacheDir } from './model.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config: WebdriverIO.Config = {
    specs: [path.join(__dirname, '*.e2e.ts')],
    /**
     * every spec runs in Chrome and Firefox: more sessions at once than a
     * CI machine has cores make the steps time out
     */
    maxInstances: 4,
    /**
     * several Firefox sessions start at once on a Windows CI runner: a busy Firefox
     * can accept the BiDi connection more than 10 s after the session starts
     */
    bidiConnectTimeout: 30000,
    capabilities: [{
        browserName: 'chrome',
        /**
         * Chrome 156 and 157 hang every BiDi command in a tab that `window.open`
         * opened (frames.e2e.ts): https://issues.chromium.org/issues/571161446
         * Fixed in Chrome 158 (https://chromium-review.googlesource.com/c/chromium/src/+/8574800): remove the pin then.
         */
        browserVersion: '155',
        webSocketUrl: true,
        'goog:chromeOptions': { args: ['headless', 'disable-gpu'] }
    }, {
        browserName: 'firefox',
        webSocketUrl: true,
        'moz:firefoxOptions': { args: ['-headless'] }
    }],
    services: [['ai', { model: actModel, cache: 'off', cacheDir, workspace: { dir: path.join(cacheDir, 'workspaces') }, effects: { ignore: ['/telemetry'] } }]],
    /**
     * the logs are uploaded when CI fails: the command times and what the effect
     * recorder counted are what explains a flaky step
     */
    logLevel: 'info',
    logLevels: { '@wdio/ai-service': 'debug' },
    framework: 'mocha',
    reporters: ['spec'],
    outputDir: __dirname,
    mochaOpts: { ui: 'bdd', timeout: 60000 }
}
