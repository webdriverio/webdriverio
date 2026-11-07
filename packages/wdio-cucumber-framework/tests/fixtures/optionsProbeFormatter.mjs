import { Formatter } from '@cucumber/cucumber'

/** keeps the options that Cucumber gives to a formatter */
export default class OptionsProbeFormatter extends Formatter {
    constructor (options) {
        super(options)
        globalThis.CUCUMBER_FORMAT_OPTIONS = options.parsedArgvOptions
    }
}
