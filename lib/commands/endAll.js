/**
 *
 * End all selenium server sessions at once.
 *
 * @uses protocol/sessions, protocol/session
 * @type utility
 *
 */

var async = require('async');

module.exports = function endAll () {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1],
        self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.sessions(cb);
        },
        function(res,cb) {
            response.sessions = res;
            response.session = [];

            res.value.forEach(function(session) {
                self.session('delete', session.id, function(err,res) {
                    if(err) {
                        return cb(err);
                    }

                    response.session.push(res);
                });
            });
            self.call(cb);
        }
    ], function(err) {

        callback(err, null, response);

    });

};
