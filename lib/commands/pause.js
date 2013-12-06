module.exports = function pause (milliseconds, callback) {
    setTimeout(callback, milliseconds);
};

