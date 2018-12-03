import TestStats from './test'
import RunnableStats from './runnable'

export default class HookStats extends TestStats {
    constructor (runner) {
        runner.type = 'hook'
        super(runner)
        this.uid = RunnableStats.getIdentifier(runner)
        this.cid = runner.cid
        this.title = runner.title
        this.parent = runner.parent
        this.parentUid = runner.parentUid
    }
}
