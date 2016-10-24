/**
 *
 * End all selenium server sessions at once. Like the [`end`](/api/utility/end.html) command is this command
 * only supported in standalone mode.
 *
 * @alias browser.endAll
 * @uses protocol/sessions, protocol/session
 * @type utility
 *
 */

let endAll = function () {
    return this.sessions().then((res) => {
        let sessionCommands = []

        for (let session of res.value) {
            sessionCommands.push(this.session('delete', session.id))
        }

        return this.unify(sessionCommands)
    })
}

export default endAll
