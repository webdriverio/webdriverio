module.exports = function init (desiredCapabilities, callback) {
    var merge = require('deepmerge');

    var commandOptions = {
        path:"/session",
        method:"POST"
    };

    if (typeof desiredCapabilities == "function") {
        callback = desiredCapabilities;
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
            if (err) return callback(err);

            this.pack(function(err, data){
                if (err) return callback(err);

                /**
                 * add extension
                 */
                that.desiredCapabilities.chromeOptions = {
                    extensions: [data.toString('base64')]
                }

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