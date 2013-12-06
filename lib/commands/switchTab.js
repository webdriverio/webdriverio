module.exports = function switchTab (tabID, callback) {

    this.window(tabID, function(err, result) {
        callback(err, result && result.value);
    });

};