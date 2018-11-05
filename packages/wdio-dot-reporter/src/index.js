import chalk from 'chalk'
import WDIOReporter from '@wdio/reporter'

/**
 * Initialize a new `Dot` matrix test reporter.
 */
export default class DotReporter extends WDIOReporter {
    constructor (options) {
        /**
         * make dot reporter to write to output stream by default
         */
        options = Object.assign({ stdout: true }, options)
        super(options)
    }

    /**
     * pending tests
     */
    onTestSkip () {
        this.write(chalk.cyanBright('.'))
    }

    /**
     * passing tests
     */
    onTestPass () {
        this.write(chalk.greenBright('.'))
    }

    /**
     * failing tests
     */
    onTestFail () {
        this.write(chalk.redBright('F'))
    }
}
