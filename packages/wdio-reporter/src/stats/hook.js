import RunnableStats from './runnable'

export default class HookStats extends RunnableStats {
    constructor (runner) {
        super('hook')
        this.uid = RunnableStats.getIdentifier(runner)
        this.title = runner.title
        this.parent = runner.parent
        this.parenUid = runner.parentUid || runner.parent
        this.currentTest = runner.currentTest
    }
}
