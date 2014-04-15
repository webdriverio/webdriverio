module.exports = function getCookie (name, callback) {

    if(typeof name == "function") {
        callback = name;
        name = null;
    }

    this.cookie(function(err,result) {

        /* istanbul ignore else */
        if(err === null && result.value) {

            var cookie = result.value;

            if(name) {
                cookie = cookie.filter(function(obj) {
                    return obj.name == name;
                })[0] || null;
            }

            if(typeof callback === 'function') {
                callback(err,cookie);
            }

        } else {

            if(typeof callback === 'function') {
                callback(err,result);
            }

        }
    });
};