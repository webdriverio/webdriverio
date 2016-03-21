describe('multiremote example', function() {
    it('should open chat application', function () {
        browser.url('/');
    });

    it('should login the browser', function () {
        browserA.setValue('.usernameInput', 'Browser A');
        browserB.setValue('.usernameInput', 'Browser B');
        browser.sync();
    });

    it('should submit the login form', function () {
        browser.keys('Enter');
    });

    it('should post something in browserA', function () {
        browserA.setValue('.inputMessage', 'Hey Whats up!').pause(1000);
        browserA.keys('Enter');
        browserA.setValue('.inputMessage', 'My name is Edgar').keys('Enter').pause(200);
    });

    it('should read the message in browserB', function () {
        var message = browserB.getText('.messageBody*=My name is');
        var name = message.slice(11);
        browserB.setValue('.inputMessage', 'Hello ' + name + '! How are you today?').keys('Enter');
    });

    it('should end the session', function () {
        browser.pause(5000);
        browser.end();
    });
});
