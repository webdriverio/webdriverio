// @ts-ignore
const BaseReporter = Mocha.reporters.html

export default class HTMLReporter extends BaseReporter {
    constructor(runner: any, options: any) {
        super(runner, options)
    }

    addCodeToggle() {}
}
