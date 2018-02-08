import chalk from 'chalk'
import WDIOReporter from 'wdio-reporter'

/**
 * Initialize a new `Dot` matrix test reporter.
 */
class DotReporter extends WDIOReporter {
    /**
     * print empty line at the beginning
     */
    onStart () {
        process.stdout.write('\n')
    }

    /**
     * pending tests
     */
    onTestSkip () {
        process.stdout.write(chalk.cyanBright('.'))
    }

    /**
     * passing tests
     */
    onTestPass () {
        process.stdout.write(chalk.greenBright('.'))
    }

    /**
     * failing tests
     */
    onTestFail () {
        process.stdout.write(chalk.redBright('.'))
    }
}

export default DotReporter
