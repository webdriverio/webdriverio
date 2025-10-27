// @ts-check
import { defineConfig } from '@wdio/config'

/**
 * Read environment variables from file
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'node:path';
// dotenv.config({ path: path.resolve(import.meta.dirname, '.env') });

/**
 * @see https://webdriver.io/docs/configuration
 */
exports.config = defineConfig({
    runner: 'local',
    /**
     * Define which test specs should run. The path is a glob pattern that is relative to
     * the directory of the configuration file being run.
     */
    specs: [
        './test/specs/**/*.js'
    ],
    /**
     * WebdriverIO can run multiple capabilities at the same time, each running in a separate session.
     * A capability represents an environment to test in, which can be an emulated device, a mobile or desktop device or just a browser.
     * The environment can exist locally (local browser, Docker) or remotely (cloud or a Selenium grid).
     */
    capabilities: [{
        browserName: 'chrome'
    }],
    // The 'dot' reporter is automatically used by default
    // For all reporter options see: https://webdriver.io/docs/dot-reporter
    reporters: ['spec'],
    /* Framework to run your tests in */
    framework: 'mocha',
})
