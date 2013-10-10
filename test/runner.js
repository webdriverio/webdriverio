var _           = require('lodash'),
    glob        = require('glob'),
    Mocha       = require('mocha'),
    request     = require('request'),
    chai        = require('chai'),
    assert      = chai.assert,
    should      = chai.should(),
    expect      = chai.expect,
    webdriverjs = require('../index.js'),
    config      = require('./config'),
    env         = config.env.local,
    testfiles   = glob.sync(__dirname + '/spec/*.js');

// filter files if param is given
if(process.argv[7]) {
    testfiles = _.filter(testfiles,function(filename) {
        return filename.indexOf(process.argv[7]) >= 0;
    });
}

describe('WebdriverJS api test', function() {

    _.each(env.capabilties,function(capabilty) {

        describe('using ' + capabilty.browserName,function(done) {

            before(function(done) {
                
                _.extend(capabilty, env.defaultCapabilities);

                var options = env.options;
                options.desiredCapabilities = capabilty;

                this.client = webdriverjs.remote(options);
                this.client.init().call(done);
            });

            _.each(testfiles,function(file) {
                require(file)(config.testpageURL,config.testpageTitle,assert,should,expect,capabilty.browserName);
            });

            after(function(done) {

                if(!env.requestOptions) {
                    this.client.end(done);
                    return;
                }

                // mark travis job as passed
                var options = env.requestOptions;
                options.url += this.client.requestHandler.sessionID;

                request(options, function(err) {
                    
                    if(err) {
                        throw err;
                    }

                    this.client.end(done);

                }.bind(this));

            });

        });

    });

});