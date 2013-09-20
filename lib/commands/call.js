exports.command = function(callback) {

    if (typeof callback === "function") {
        process.nextTick(callback);
    }

};
