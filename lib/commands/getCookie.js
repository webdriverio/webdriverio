var async = require('async');

module.exports = function getCookie (name) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * paramter check
     */
    if(typeof name !== 'string') {
        name = null;
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.cookie(cb);
        },
        function(res, cb) {
            response.cookie = res;
            cb();
        }
    ], function(err) {

        var cookie = response.cookie.value;

        if(name) {
            cookie = cookie.filter(function(obj) {
                return obj.name === name;
            })[0] || null;
        }

        callback(err, cookie || {} ,response);

    });

};