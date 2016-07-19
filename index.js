/**
 * webdriverio
 * https://github.com/Camme/webdriverio
 *
 * A WebDriver module for nodejs. Either use the super easy help commands or use the base
 * Webdriver wire protocol commands. Its totally inspired by jellyfishs webdriver, but the
 * goal is to make all the webdriver protocol items available, as near the original as possible.
 *
 * Copyright (c) 2013 Camilo Tapia <camilo.tapia@gmail.com>
 * Licensed under the MIT license.
 *
 * Contributors:
 *     Dan Jenkins <dan.jenkins@holidayextras.com>
 *     Christian Bromann <mail@christian-bromann.com>
 *     Vincent Voyer <vincent@zeroload.net>
 */

import WebdriverIO from './lib/webdriverio'
import Multibrowser from './lib/multibrowser'
import ErrorHandler from './lib/utils/ErrorHandler'
import getImplementedCommands from './lib/helpers/getImplementedCommands'
import Launcher from './lib/launcher'
import pkg from './package.json'

const IMPLEMENTED_COMMANDS = getImplementedCommands()
const VERSION = pkg.version

let remote = function (options = {}, modifier) {
    /**
     * initialise monad
     */
    let wdio = WebdriverIO(options, modifier)

    /**
     * build prototype: commands
     */
    for (let commandName of Object.keys(IMPLEMENTED_COMMANDS)) {
        wdio.lift(commandName, IMPLEMENTED_COMMANDS[commandName])
    }

    let prototype = wdio()
    prototype.defer.resolve()
    return prototype
}

let multiremote = function (options) {
    let multibrowser = new Multibrowser()

    for (let browserName of Object.keys(options)) {
        multibrowser.addInstance(
            browserName,
            remote(options[browserName], multibrowser.getInstanceModifier())
        )
    }

    return remote(options, multibrowser.getModifier())
}

export { remote, multiremote, VERSION, ErrorHandler, Launcher }
