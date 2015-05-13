/**
 * Mocha runner
 */
module.exports.run = function(config, specs, capabilities) {
    var Mocha = require('mocha'),
        mocha = new Mocha(config.mochaOpts);

    mocha.loadFiles();

    /**
     * ToDo implement onPrepare
     */

    specs.foreach(function(spec) {
        mocha.addFile(spec);
    });

    var runner = mocha.run(function(failures) {

    });

    /**
     * ToDo register listeners
     */

}