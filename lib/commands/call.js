exports.command = function(callback) {

    if (typeof callback === "function") {
        setTimeout(callback, 0);
    }

};
