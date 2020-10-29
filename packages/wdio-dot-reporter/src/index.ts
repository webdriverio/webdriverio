import chalk from 'chalk'
import WDIOReporter from '@wdio/reporter'
import type fs from 'fs'

/**
 * Initialize a new `Dot` matrix test reporter.
 */
export default class DotReporter extends WDIOReporter {
    options!: WDIOReporter.Options;
    outputStream!: fs.WriteStream;

    constructor(options: WDIOReporter.Options) {
        /**
         * make dot reporter to write to output stream by default
         */
        options = Object.assign({ stdout: true }, options)
        super(options)
    }

    /**
     * pending tests
     */
    onTestSkip(): void {
        this.write(chalk.cyanBright('.'))
    }

    /**
     * passing tests
     */
    onTestPass(): void {
        this.write(chalk.greenBright('.'))
    }

    /**
     * failing tests
     */
    onTestFail(): void {
        this.write(chalk.redBright('F'))
    }
}
