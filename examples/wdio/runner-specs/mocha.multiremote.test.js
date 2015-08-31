describe('multiremote example', function() {

    it('should open chat application', function*() {
        yield browser.url('/');
    });

    it('should login the browser', function* () {
        yield browserA.setValue('.usernameInput', 'Browser A');
        yield browserB.setValue('.usernameInput', 'Browser B');
        yield browser.sync();
    });

    it('should submit the login form', function* () {
        yield browser.keys('Enter');
    });

    it('should post something in browserA', function* () {
        yield browserA
            .setValue('.inputMessage', 'Hey Whats up!').pause(1000).keys('Enter').pause(100)
            .setValue('.inputMessage', 'My name is Edgar').keys('Enter');
    });

    it('should read the message in browserB', function* () {
        var message = yield browserB
            .pause(200)
            .getText('.messageBody*=My name is');

        var name = message.slice(11);
        yield browserB.setValue('.inputMessage', 'Hello ' + name + '! How are you today?').keys('Enter');
    });

    it('should end the session', function* () {
        yield browser.pause(2000).end();
    });

});
