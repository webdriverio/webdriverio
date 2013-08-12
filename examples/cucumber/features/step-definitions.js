/**
 * to run these tests you need install Cucumber.js on your machine
 * take a look at https://github.com/cucumber/cucumber-js for more informations
 *
 * first, install Cucumber.js via NPM
 * $ npm install -g cucumber
 *
 * then go into the cucumber directory and start the tests with
 * $ cucumber.js
 */

var webdriverjs = require('../../../index'),
    assert      = require('assert');

var sharedSteps = module.exports = function(){

    var client    = webdriverjs.remote({ desiredCapabilities: {browserName: 'phantomjs'}, logLevel: 'silent' }),
        tmpResult = null;
    client.init();

    this.Given(/^I go on the website "([^"]*)"$/, function(url, next) {
        client
            .url(url)
            .call(next);
    });

    this.When(/^I use getElementSize\(\) on the element "([^"]*)"$/, function(className, next) {
        client
            .getElementSize(className, function(err, result) {
                assert(err === null, 'command getElementSize() returns with an error');
                tmpResult = result;
                next();
            });
    });

    this.When(/^I use getTitle\(\) to get the title of this website$/, function(next) {
        client
            .getTitle(function(err, title) {
                assert(err === null, 'command getTitle() returns with an error');
                tmpResult = title;
                next();
            });
    });

    this.When(/^I use getElementCssProperty\(\) to get the "([^"]*)" attribute of an element with "([^"]*)" "([^"]*)"$/, function(attribute, findBy, cssSelector, next) {
        client
            .getElementCssProperty(findBy, cssSelector, attribute, function(err, result) {
                assert(err === null, 'command getElementCssProperty() returns with an error');
                tmpResult = result;
                next();
            });
    });

    this.Then(/^I should get a width of "([^"]*)" and height of "([^"]*)"$/, function(width, height, next) {
        assert(tmpResult.width  == width , 'width of element is ' + tmpResult.width + ' but should be ' + width);
        assert(tmpResult.height == height, 'height of element is ' + tmpResult.width + ' but should be ' + height);
        next();
    });

    this.Then(/^the command should return "([^"]*)"$/, function(result, next) {
        assert(tmpResult == result , ' result of command is "'+ tmpResult + '" but should be "'+ result);
        next();
    });
};