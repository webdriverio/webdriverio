export class SnapshotError extends Error {
    code: string
    hint?: string

    constructor (code: string, message: string, opts: { hint?: string } = {}) {
        super(message)
        this.name = 'SnapshotError'
        this.code = code
        this.hint = opts.hint
    }
}
