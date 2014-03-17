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

    if(this.options.experimental && this.desiredCapabilities.browserName === 'chrome') {
        var that = this,
            fs   = require('fs'),
            join = require('path').join,
            ChromeExtension = require('crx'),
            crx = new ChromeExtension({
                privateKey: fs.readFileSync(join(__dirname, '../../extension/key.pem')),
                codebase: 'http://localhost:8000/webdriverjshelper.crx',
                rootDirectory: join(__dirname, '../../extension/chrome')
            });

        crx.load(function(err) {
          if (err) throw err;

          this.pack(function(err, data){
            if (err) throw err;

            that.desiredCapabilities.chromeOptions = {
                extensions: [data.toString('base64')]
            }

            that.requestHandler.create(
                commandOptions,
                {desiredCapabilities: that.desiredCapabilities},
                callback
            );

            this.destroy();
          })
        })

        return;
    }

    this.requestHandler.create(
        commandOptions,
        {desiredCapabilities:this.desiredCapabilities},
        callback
    );

};