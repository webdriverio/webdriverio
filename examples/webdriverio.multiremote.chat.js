var WebdriverIO = require('../'),
    matrix = WebdriverIO.multiremote({
        browserA: { desiredCapabilities: { browserName: 'firefox' } },
        browserB: { desiredCapabilities: { browserName: 'firefox' } }
    }),
    browserA = matrix.select('browserA'),
    browserB = matrix.select('browserB'),
    name;

/**
 * open chat application
 */
matrix.init().url('http://chat.socket.io/');

/**
 * login
 */
browserA.setValue('.usernameInput', 'Browser A');
browserB.setValue('.usernameInput', 'Browser B');

/**
 * submit login form
 */
matrix.keys('Enter');

/**
 * post message with browser A and check if message arrives and answer properly
 */
browserA
    .setValue('.inputMessage', 'Hey Whats up!').pause(1000).keys('Enter').pause(100)
    .setValue('.inputMessage', 'My name is LULULULULU').keys('Enter');

browserB
    .waitForExist('.messages .message')
    .getText('.messages .message', function(err, messages) {
        var message = messages[messages.length - 1],
            name = message.slice(20);

        browserB.setValue('.inputMessage', 'Hello ' + name + '! How are you today?').keys('Enter');
    });

/**
 * end session
 */
matrix.pause(2000).end();