import RunnableStats from './runnable'

export default class HookStats extends RunnableStats {
    constructor (runner) {
        super('hook')
        this.uid = RunnableStats.getIdentifier(runner)
        this.cid = runner.cid
        this.title = runner.title
        this.parent = runner.parent
        this.parentUid = runner.parentUid
    }
}
