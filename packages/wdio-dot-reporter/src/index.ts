import chalk from 'chalk'
import WDIOReporter, { hookCountsAsFailure, type HookStats } from '@wdio/reporter'
import type { Reporters } from '@wdio/types'

/**
 * Initialize a new `Dot` matrix test reporter.
 */
export default class DotReporter extends WDIOReporter {
    constructor(options: Reporters.Options) {
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

    /**
     * a failed Cucumber BeforeAll / AfterAll: it fails no test (K26)
     */
    onHookEnd(hook: HookStats): void {
        if (hookCountsAsFailure(hook) && this.parentOf(hook)?.type === 'feature') {
            this.write(chalk.redBright('F'))
        }
    }
}
