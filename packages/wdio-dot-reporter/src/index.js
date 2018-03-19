import fs from 'fs'
import chalk from 'chalk'
import WDIOReporter from 'wdio-reporter'

/**
 * Initialize a new `Dot` matrix test reporter.
 */
export default class DotReporter extends WDIOReporter {
    constructor (...args) {
        super(...args)
        this.outputStream = this.options.stdout ? process.stdout : fs.createWriteStream(this.options.logFile)
    }

    /**
     * print empty line at the beginning
     */
    onRunnerStart () {
        this.write('\n')
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

    /**
     * write to target environment
     */
    write (...args) {
        this.outputStream.write(...args)
    }
}
