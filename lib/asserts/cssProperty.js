exports.command = function(cssSelector, cssProperty, expected, message) {

    this.getCssProperty(cssSelector, cssProperty, function(result) {
        this.showTest(result === expected, result, expected, message);
    }.bind(this));

};