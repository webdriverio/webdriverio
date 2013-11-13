module.exports = function call (callback) {
    if (typeof callback === "function") {
        process.nextTick(callback);
    }

};
