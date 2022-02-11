module.exports = {
    isCommand : function(expression, command) {
        if (
            expression &&
            expression.object && expression.object.name === 'browser' &&
            expression.property && expression.property.name === command
        ) {
            return true
        }
    }
}
