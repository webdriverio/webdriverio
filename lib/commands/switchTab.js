module.exports = function switchTab (tabID, callback) {

    if(typeof tabID !== 'string') {
        callback(new Error('tabID (type of ' + (typeof tabID) + ') has to be type of string'));
        return;
    }

    this.window(tabID, function(err, result) {
        callback(err, result && result.value);
    });

};