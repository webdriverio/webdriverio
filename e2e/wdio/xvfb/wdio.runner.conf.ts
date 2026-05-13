import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * Exercises the full LocalRunner ↔ DisplayServerManager ↔ DisplayProcessFactory
 * integration: a real wdio worker is forked by the runner, the display-server
 * daemon is provisioned around it, and Chrome is driven *without* --headless so
 * the daemon-backed display is required for the session to succeed.
 *
 * Distinct from wdio.conf.ts which runs the existing/base/launcher specs with
 * autoXvfb:false (those tests drive DisplayServerManager directly and use a
 * --headless Chrome that doesn't need the display).
 */
export const config: WebdriverIO.Config = {
    specs: [
        path.join(__dirname, 'runner.e2e.ts')
    ],

    /**
     * No --headless: the worker actually needs the display the runner provisions.
     */
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [
                '--no-sandbox',
                '--disable-dev-shm-usage'
            ],
            ...(process.env.CHROME_BIN && { binary: process.env.CHROME_BIN })
        }
    }],

    logLevel: 'info',
    framework: 'mocha',
    outputDir: path.join(__dirname, 'logs'),

    runner: 'local',

    /**
     * Let the local runner manage the display server. With no DISPLAY /
     * WAYLAND_DISPLAY in the container env, the runner must spin up Xvfb or
     * Weston and ensure the worker child process inherits the right env vars
     * for Chrome to launch.
     */
    displayServerEnabled: true,
    displayServer: 'auto',

    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 120000
    },
}
