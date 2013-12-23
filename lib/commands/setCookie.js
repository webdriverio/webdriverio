module.exports = function setCookie (cookieObj, callback) {

    // throw error if no cookie object is given
    if(typeof cookieObj !== 'object') {
        throw 'Please specify a cookie object to set (see http://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object for documentation.';
    }

    this.cookie('POST', cookieObj, function(err, result) {

        if(typeof callback === 'function') {
           callback(err, result && result.value);
        }

    });

};