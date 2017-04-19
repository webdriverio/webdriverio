import path from 'path'
import merge from 'deepmerge'

import defaults from './defaults.js'

const PLATFORMS_DIR = path.resolve(__dirname, '..', 'site', 'platforms')
const BUILD_ENV = (process.env.npm_lifecycle_event || '').split(':').pop()

/**
 * set up desktop environment for local dev
 */
if (BUILD_ENV === 'desktop' && !process.env._BROWSER) {
    process.env._BROWSER = 'chrome'
}

/**
 * setup mobile environment for local dev (this might be different for you)
 */
if (!process.env.CI && BUILD_ENV === 'ios') {
    process.env._PLATFORM = 'iOS'
    process.env._VERSION = '9.2'
    process.env._DEVICENAME = 'iPhone 6'
    process.env._APP = path.join(PLATFORMS_DIR, 'ios', 'build', 'emulator', 'WebdriverIO Guinea Pig.app')
} else if (!process.env.CI && BUILD_ENV === 'android') {
    process.env._PLATFORM = 'Android'
    process.env._VERSION = '4.4'
    process.env._DEVICENAME = 'Samsung Galaxy S4 Emulator'
    process.env._APP = path.join(PLATFORMS_DIR, 'android', 'build', 'outputs', 'apk', 'android-debug.apk')
}

const ENV = process.env.TRAVIS && BUILD_ENV !== 'functional' && BUILD_ENV !== 'multibrowser' ? 'travis-ci' : 'local'
let asked = require(`./${ENV}.js`)

if (BUILD_ENV.match(/(android|ios)/)) {
    const mobile = require('./mobile')
    asked = merge(asked, mobile)

    delete asked.desiredCapabilities.browserName
    delete asked.desiredCapabilities.platform
    delete asked.desiredCapabilities.version
    delete asked.desiredCapabilities.screenResolution
}

const conf = merge(defaults, asked)

if (conf.desiredCapabilities && conf.desiredCapabilities.browserName === 'chrome') {
    conf.desiredCapabilities.chromeOptions = {
        args: ['--disable-popup-blocking']
    }
}

export default conf
