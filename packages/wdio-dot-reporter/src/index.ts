import chalk from 'chalk'
import WDIOReporter, { WDIOReporterOptions } from '@wdio/reporter'

/**
 * Initialize a new `Dot` matrix test reporter.
 */
export default class DotReporter extends WDIOReporter {
    constructor(options: Partial<WDIOReporterOptions>) {
        super(Object.assign({ stdout: true }, options))
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
