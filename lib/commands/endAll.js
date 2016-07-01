/**
 *
 * End all selenium server sessions at once.
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
