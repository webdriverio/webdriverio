/**
 *
 * End all selenium server sessions at once.
 *
 * @uses protocol/sessions, protocol/session
 * @type utility
 *
 */

module.exports = function endAll () {

    return this.sessions().then(function(res) {

        var self = this,
            sessionCommands = [];

        res.value.forEach(function(session) {
            sessionCommands.push(self.session('delete', session.id));
        });

        return this.unify(sessionCommands);

    });

};
