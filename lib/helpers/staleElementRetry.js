/**
 * Retry command if it encounters a StaleElementReference
 */
module.exports = function(name, args, exception) {
    if (exception.seleniumStack && exception.seleniumStack.type === 'StaleElementReference') {
        this.logger.log('Caught StaleElementReference. Will retry ' + name + '().');
        return this[name].apply(this, args);
    }
    throw exception;
}