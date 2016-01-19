import merge from 'deepmerge'
import defaults from './defaults.js'

const ENV = process.env.TRAVIS && process.env._BROWSER !== 'phantomjs' && process.env._ENV !== 'multibrowser' ? 'travis-ci' : 'local'
let asked = require(`./${ENV}.js`)

if (process.env._ENV && process.env._ENV.match(/(android|ios)/)) {
    const mobile = require('./mobile')
    asked = merge(asked, mobile)
}

const conf = merge(defaults, asked)

if (conf.desiredCapabilities && conf.desiredCapabilities.browserName === 'chrome') {
    conf.desiredCapabilities.chromeOptions = {
        args: ['--disable-popup-blocking']
    }
}

export default conf
