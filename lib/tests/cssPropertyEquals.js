exports.command = function(cssSelector, cssProperty, expected, message) {

    this.getCssProperty(cssSelector, cssProperty, function(result) {
        self.showTest(result === expected, result, expected, message);
    });

};

