/**
 * QueueItem
 * https://github.com/Camme/webdriverjs
 *
 * @author Camilo Tapia <camilo.tapia@gmail.com>
 *     
 */

var QueueItem = module.exports = function(commandName, method, scope, args, isUserCommand) {

    'use strict';

    this.children = [];
    this.commandName = commandName;
    this.method = method;
    this.scope = scope;
    this.currentChildIndex = 0;
    this.isDone = false;
    this.args = [];
    this.isUserCommand = isUserCommand;

    var self = this,
        hasCallback = false,
        nextCallback = function(method, methodName) {
            return function(err,result) {

                function errorCB() {
                    self.next();
                }

                process.on('uncaughtException', errorCB);

                // call the callback
                method.call(scope, err, result);

                // call the next item
                self.next();

                // remove the listener to avoid memoryleakes. but do it after self.next so we know everything went well
                process.removeListener('uncaughtException', errorCB);

            };
        };

    // change callback
    for(var i = 0, ii = args.length; i < ii; i++) {
        var currentArg = args[i];
        if (typeof currentArg == "function" && i == (args.length - 1)) {
            hasCallback = true;
            this.args.push(nextCallback(currentArg, commandName));
        } else {
            this.args.push(currentArg);
        }
    }

    if (!hasCallback) {
        this.args.push((function(){
            return function() {
                // continue queue after callback
                self.next();
            };
        })());
    }

    // queue item run command
    this.run = function() {

        // switch to the current queue item to make future addings to the correct queue item
        this.scope.currentQueueItem = this;

        // save the current length in case new items are added
        var currentLength = this.children.length;

        // run the command
        this.method.apply(this.scope, this.args);

        // if the command added new items to the queue, we make sure we run those commans
        if (currentLength < this.children.length) {
            this.next();
        }
    };

    // add queue item to the current item
    this.add = function(item) {

        // make a reference to its parent so we can travel back
        item.parent = this;

        // add the new item to this childrens list
        this.children.push(item);

        // if we arent running, its time now
        if (!this.scope.queueIsRunning || this.isUserCommand) {
            // make sure we switch the running flag so that we dont run .next again when a new item is added.
            this.scope.queueIsRunning = true;

            // begin the queue
            this.next();
        }
    };

    // go to next queu item
    this.next = function() {
        // if we have more children, run the next
        // otherwise tell the item we are done
        if (this.currentChildIndex < this.children.length) {
            var runIndex = this.currentChildIndex;

            // increase currentChildIndex first in case the command callback has no asynchronicity (e.g. call)
            this.currentChildIndex++;
            this.children[runIndex].run();
        } else {
            this.done();
        }
    };

    // the done method has to check if we are done for real, ie all children are done.
    // if not, we check what children are left to run
    this.done = function(scope) {

        if (!this.isDone) {
            // get the next undone child
            var checkDoneChildren = this.getNextChildToRun();

            // if its null, we know all children are done and we dont need to go further
            if (checkDoneChildren === null) {
                // mark this as done
                this.isDone = true;

                // if we have a parent, run its next command, otherwise we are in the root and are totally finished
                if (this.parent) {
                    this.parent.next();
                } else {
                    // and if we are finished we can turn off the running flag
                    this.scope.queueIsRunning = false;
                }
            }
        } else {
            // if we are done, we when wheter everything in the queue is done. if so, set the running flag to false
            var nextToRun = this.scope.currentQueueItem.getNextChildToRun();
            if (nextToRun === null) {
                this.scope.queueIsRunning = false;
            }
        }
    };

    // recursive function to get the next undone item
    this.getNextChildToRun = function() {
        var child = null;
        for(var i = 0, ii = this.children.length; i < ii; i++) {

            if (this.children[i] && !this.children[i].isDone) {
                return this.children[i];
            } else {
                child = this.children[i].getNextChildToRun();
            }

        }

        return child;
    };
};
