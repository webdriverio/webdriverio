module.exports = function deleteCookie (name, callback) {

    if(typeof name === 'function') {
        callback = name;
        name = null;
    }

    this.cookie('DELETE', name, function(err,result) {

        if(typeof callback === 'function') {
            callback(err, result);
        }

    });
};