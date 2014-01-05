// Deprecated but included for backward compatibility. Alias for 'click' command.
module.exports = function buttonClick () {
    return this.click.apply(this, arguments);
}
