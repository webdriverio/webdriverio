/**
 * CommandLoader
 * https://github.com/Camme/webdriverjs
 *
 * loads already implemented webdriver modules
 *
 * @author Christian Bromann <mail@christian-bromann.com>
 *     
 */

var path      = require('path'),
    fs        = require('fs'),
    QueueItem = require('../utils/QueueItem');

/**
 * constructor
 * @param  {Object} scope webdriverjs module object
 */
var commandLoader = module.exports = function(scope){
    this.scope = scope;
};

/**
 * loads an array of command types
 * @param  {Array} types  types of commands
 */
commandLoader.prototype.load = function(types) {
    for(var i = 0; i < types.length; ++i) {
        this.loadType(this.scope,types[i]);
    }
};

/**
 * load a single command type
 * @param  {Object} scope  scope for commands
 * @param  {Array}  types  types of commands
 */
commandLoader.prototype.loadType = function(scope, type) {

    // the acutal commands. read them dynamicaly
    var filePath    = __dirname + '/../' + type + '/',
        files       = fs.readdirSync(filePath),
        commands    = {},
        commandName = '';

    for(var i = 0; i < files.length; ++i)
    {
        if (path.extname(files[i]) == ".js") {
            commandName = path.basename(files[i], '.js');
            commands[commandName] = require(filePath + files[i]).command;
        }
    }

    this.addQueueCommands(scope,commands);

};

/**
 * iterates through the command types to register each one in the given scope
 * @param {Object} scope     scope for commands
 * @param {Object} commands  list of commands
 */
commandLoader.prototype.addQueueCommands = function(scope,commands) {

    for(var commandName in commands) {
        scope[commandName] = this.addQueueItem(commands,commandName);
    }

};

/**
 * executes if command gets called
 * creates a queue item as children of the current queue item
 * @param {Object} commands             list of commands
 * @param {String} internalCommandName  command name
 */
commandLoader.prototype.addQueueItem = function(commands,internalCommandName) {

    var self    = this.scope,
        command = commands[internalCommandName];

    if(command === undefined) {
        command = commands;
    }

    return function() {
        var newQueueItem = new QueueItem(internalCommandName, commands[internalCommandName], self, arguments);
        self.currentQueueItem.add(newQueueItem);

        // when adding commands, we return the instance of the client to be able to chain
        if (self.chain) {
            return self;
        }
    };
};