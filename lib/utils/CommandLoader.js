/**
 * CommandLoader
 * 
 * loads already implemented webdriver modules   
 */

var path      = require('path'),
    fs        = require('fs'),
    QueueItem = require('./QueueItem');

/**
 * constructor
 * @param  {Object} scope webdriverjs module object
 */
var commandLoader = module.exports = function(scope, customCommands){
    this.scope = scope;
    this.customCommands = customCommands;

    /**
     * loads an array of command types
     * @param  {Array} types  types of commands
     */
    this.load = function(types) {
        for(var i = 0; i < types.length; ++i) {
            this.loadType(this.scope,types[i]);
        }
    };

    /**
     * load a single command type
     * @param  {Object} scope  scope for commands
     * @param  {Array}  types  types of commands
     */
    this.loadType = function(scope, type) {

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
    this.addQueueCommands = function(scope,commands) {

        var customCommands = this.customCommands;

        for(var commandName in commands) {
            if(typeof this.customCommands[commandName] === 'undefined'){
                scope[commandName] = this.addQueueItem(commands[commandName],commandName);
            }
        }

        for(var customCommandName in this.customCommands){
            scope[customCommandName] = this.addQueueItem(customCommands[customCommandName],customCommandName);
        }

    };

    /**
     * executes if command gets called
     * creates a queue item as children of the current queue item
     * @param {Object} commands             list of commands
     * @param {String} internalCommandName  command name
     */
    this.addQueueItem = function(command,internalCommandName,isUserCommand) {

        var self = this.scope;

        return function() {
            var newQueueItem = new QueueItem(internalCommandName, command, self, arguments, isUserCommand);
            self.currentQueueItem.add(newQueueItem);

            // when adding commands, we return the instance of the client to be able to chain
            if (self.chain) {
                return self;
            }
        };
    };
};