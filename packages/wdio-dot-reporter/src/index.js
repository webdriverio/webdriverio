import chalk from 'chalk'
import WDIOReporter from 'wdio-reporter'

/**
 * Initialize a new `Dot` matrix test reporter.
 */
class DotReporter extends WDIOReporter {
    /**
     * print empty line at the beginning
     */
    start () {
        process.stdout.write('\n')
    }

    /**
     * pending tests
     */
    testPending () {
        process.stdout.write(chalk.cyanBright('.'))
    }

    /**
     * passing tests
     */
    testPass () {
        process.stdout.write(chalk.greenBright('.'))
    }

    /**
     * failing tests
     */
    testFail () {
        process.stdout.write(chalk.redBright('.'))
    }
}

export default DotReporter
