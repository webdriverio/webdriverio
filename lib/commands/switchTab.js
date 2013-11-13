module.exports = function switchTab (tabID, callback) {

    this.window(tabID, function(err, result) {

        if (typeof callback == "function") {

            callback(err, result && result.value);

        }

    });

};