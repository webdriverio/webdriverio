import RunnableStats, {Runnable, Error} from './runnable'

export interface Hook extends Runnable{
    cid: string,
    parent: string,
}

export default class HookStats extends RunnableStats {
    private _uid: string
    private _cid: string
    private _title: string
    private _parent: string
    private _errors?: Error[]
    private _error!: Error
    private _state: string | undefined

    constructor(runner: Hook) {
        super('hook')
        this._uid = RunnableStats.getIdentifier(runner)
        this._cid = runner.cid
        this._title = runner.title
        this._parent = runner.parent
    }

    complete(errors?: Error[]) {
        this._errors = errors
        if (errors && errors.length) {
            this._error = errors[0]
            this._state = 'failed'
        }

        super.complete()
    }
}
