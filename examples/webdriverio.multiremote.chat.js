var async = require('async'),
    WebdriverIO = require('../'),
    matrix = WebdriverIO.multiremote({
        browserA: { desiredCapabilities: { browserName: 'firefox' } },
        browserB: { desiredCapabilities: { browserName: 'firefox' } }
    }),
    browserA = matrix.select('browserA'),
    browserB = matrix.select('browserB');

async.waterfall([
    /**
     * open chat application
     */
    function(done) {
        matrix
            .init()
            .url('http://chat.socket.io/')
            .call(done);
    },
    /**
     * login
     */
    function(done) {
        browserA.setValue('.usernameInput', 'Browser A');
        browserB.setValue('.usernameInput', 'Browser B').call(done);
    },
    /**
     * submit login form
     */
    function(done) {
        matrix.keys('Enter').call(done);
    },
    /**
     * post message with browser A and check if message arrives and answer properly
     */
    function(done) {
        browserA
            .setValue('.inputMessage', 'Hey Whats up!').keys('Enter')
            .setValue('.inputMessage', 'My name is Browser A').keys('Enter');

        browserB
            .waitForExist('.messages .message')
            .getText('.messages .message', function(err, messages) {
                var message = messages[messages.length - 1],
                    name = message.slice(20);

                browserB.setValue('.inputMessage', 'Hello ' + name + '! How are you today?').keys('Enter').call(done);
            });
    }
], function() {

    /**
     * end session
     */
    matrix.pause(2000).end();

});