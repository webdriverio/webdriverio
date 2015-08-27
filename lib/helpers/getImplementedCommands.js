/**
 * helper to find all implemented commands
 *
 * @returns {String[]} list of implemented command names
 */
var path = require('path'),
    fs = require('fs');

module.exports = function() {
    var commands = {};
    ['protocol', 'commands'].forEach(function(commandType) {
        var dir = path.join(__dirname, '..', commandType),
            files = fs.readdirSync(dir);

        files.forEach(function(filename) {
            var commandName = filename.slice(0, -3);
            commands[commandName] = require(path.join(dir, commandName));
        });
    });

    return commands;
};