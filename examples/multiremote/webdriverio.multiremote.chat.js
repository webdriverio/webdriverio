/**
 * Multiremote example
 * To run this script you need to have Mocha installed globally on your system.
 * If not try to run: $ npm install -g mocha
 *
 * To execute it just run it as a spec with a fair amount of timeout:
 * $ mocha -t 9999999 examples/webdriverio.multiremote.chat.js
 */

var WebdriverIO = require('../../build'),
    matrix = WebdriverIO.multiremote({
        browserA: { desiredCapabilities: { browserName: 'chrome' } },
        browserB: { desiredCapabilities: { browserName: 'chrome' } }
    }),
    browserA = matrix.select('browserA'),
    browserB = matrix.select('browserB');

describe('multiremote example', function() {

    this.timeout = 99999999;

    it('should open chat application', function() {
        return matrix.init().url('http://chat.socket.io/');
    });

    it('should login the browser', function(done) {
        browserA.setValue('.usernameInput', 'Browser A');
        browserB.setValue('.usernameInput', 'Browser B');
        return matrix.sync().call(done);
    });

    it('should submit the login form', function() {
        return matrix.keys('Enter');
    });

    it('should post something in browserA', function() {
        return browserA
            .setValue('.inputMessage', 'Hey Whats up!').pause(1000).keys('Enter').pause(100)
            .setValue('.inputMessage', 'My name is Edgar').keys('Enter');
    });

    it('should read the message in browserB', function() {
        return browserB
            .pause(200)
            .getText('.messageBody*=My name is').then(function(message) {
                var name = message.slice(11);
                return browserB.setValue('.inputMessage', 'Hello ' + name + '! How are you today?').keys('Enter');
            });
    });

    it('should end the session', function() {
        return matrix.pause(2000).end();
    });

});
