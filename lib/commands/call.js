module.exports = function call (callback) {
    process.nextTick(callback);
};
