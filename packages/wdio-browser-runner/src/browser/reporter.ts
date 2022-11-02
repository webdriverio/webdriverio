import type { Runner } from 'mocha'

const BaseReporter = Mocha.reporters.html

export default class HTMLReporter extends BaseReporter {
    constructor (runner: Runner, options: Mocha.MochaOptions) {
        super(runner, options)
    }

    addCodeToggle () {}
}
