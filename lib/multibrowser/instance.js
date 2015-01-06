var chainIt = require('chainit'),
    child_process = require('child_process'),
    path = require('path'),
    flag = 0.5;

/**
 * Multibrowser instance
 */
function Instance(instanceName, capabilities) {
    /**
     * assign bitmask
     */
    flag *= 2;
    this.flag = flag;
    this.name = instanceName;

    /**
     * process disconnect listener
     * gets called once an instance called the `end` method
     */
    this.onDisconnect = function(e) {
        this.cp.kill();
    };

    this.cp = child_process.fork(__dirname + path.sep + 'runner.js');
    this.cp.on('disconnect', this.onDisconnect.bind(this));

    /**
     * populate child process methods
     */
    this.send = this.cp.send.bind(this.cp);
    this.on = this.cp.on.bind(this.cp);

    /**
     * initialise process instance
     */
    this.cp.send({
        action: 'initiate',
        capabilities: capabilities
    });
};

module.exports = chainIt(Instance);