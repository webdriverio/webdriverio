module.exports = function getCookie (name, callback) {

    if(typeof name == "function") {
        callback = name;
        name = null;
    }

    this.cookie('GET', null, function(err,result) {

        if(err === null && result.value) {

            var cookie = result.value;

            if(name) {
                cookie = cookie.filter(function(obj) {
                    return obj.name == name;
                })[0];

                cookie = cookie ? cookie : null;
            }

            if(typeof callback === 'function') {
                callback(err,cookie);
            }

        } else {

            if(typeof callback === 'function') {
                /* istanbul ignore next */
                callback(err,result);
            }

        }
    });
};