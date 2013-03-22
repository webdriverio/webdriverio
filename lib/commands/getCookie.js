exports.command = function(name, callback) {

    if(typeof name == "function") {
        callback = name;
        name = null;
    }

    this.cookie(function(result) {

        if(result.status === 0) {

            var cookie = result.value;

            if(name) {
                cookie = cookie.filter(function(obj) {
                    return obj.name == name;
                })[0];

                cookie = cookie ? cookie : null;
            }

            if(typeof callback === 'function')
            {
                callback(cookie);
            }

        } else {

            if(typeof callback === 'function') {
                callback(result);
            }

        }
    });
};