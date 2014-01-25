module.exports = function setCookie (cookieObj, callback) {

    // throw error if no cookie object is given
    if(typeof cookieObj !== 'object') {
        return typeof callback === 'function' ? callback(new Error('Please specify a cookie object to set (see http://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object for documentation.')) : false;
    }

    this.cookie('POST', cookieObj, function(err, result) {

        if(typeof callback === 'function') {
            callback(err, result && result.value);
        }

    });

};