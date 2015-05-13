var ConfigParser = require('./utils/ConfigParser');

process.on('message', function(m) {
    switch(m.command) {
        case 'run':

            var configParser = new ConfigParser();
            configParser.addConfigFile(m.configFile);

            var config = configParser.getConfig(),
                framework;

            if(config.framework === 'mocha') {
                framework = require(__dirname + '/frameworks/mocha');
            } else {
                throw new Error('Don\'t know the framework "' + config.framework + '"');
            }

            framework.run(config, m.specs, m.capabilities);

        break;
        default:
            throw new Error('Can\'t recognise "' + m.command + '" command');
    }


});