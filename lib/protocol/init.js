/**
 *
 * Create a new session. The server should attempt to create a session that most
 * closely matches the desired and required capabilities. Required capabilities
 * have higher priority than desired capabilities and must be set for the session
 * to be created.
 *
 * @param {Object} capabilities An object describing the session's [desired capabilities](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Desired_Capabilities).
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session
 *
 */

module.exports = function init (desiredCapabilities) {
    var merge = require('deepmerge'),
        callback = arguments[arguments.length - 1],
        commandOptions = {
            path: '/session',
            method: 'POST'
        };

    if (typeof desiredCapabilities == 'function') {
        desiredCapabilities = null;
    } else {
        this.desiredCapabilities = merge(this.desiredCapabilities, desiredCapabilities);
        if (desiredCapabilities.sessionId) {
            this.sessionId = desiredCapabilities.sessionId;
        }
    }

    /**
     * build chrome extension if experimental mode is enabled
     */
    if(this.options.experimental && this.desiredCapabilities.browserName === 'chrome') {
        var that = this,
            fs   = require('fs'),
            join = require('path').join,
            ChromeExtension = require('crx'),
            crx = new ChromeExtension({
                privateKey: fs.readFileSync(join(__dirname, '../../extension/key.pem')),
                rootDirectory: join(__dirname, '../../extension/chrome')
            });

        crx.load(function(err) {
            if (err) return callback(new ErrorHandler.ProtocolError(err));

            this.pack(function(err, data){
                if (err) return callback(new ErrorHandler.ProtocolError(err));

                /**
                 * add extension
                 */
                that.desiredCapabilities.chromeOptions = {
                    extensions: [data.toString('base64')]
                };

                that.requestHandler.create(
                    commandOptions,
                    {desiredCapabilities: that.desiredCapabilities},
                    callback
                );

                /**
                 * remove created build
                 */
                this.destroy();
            });
        });

        return;
    }

    this.requestHandler.create(
        commandOptions,
        {desiredCapabilities:this.desiredCapabilities},
        callback
    );

};