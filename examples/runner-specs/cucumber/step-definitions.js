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

var assert = require('assert'),
    tmpResult;

module.exports = function(){

    this.Given(/^I go on the website "([^"]*)"$/, function(url, next) {
        browser
            .url(url)
            .call(next);
    });

    this.When(/^I use getElementSize\(\) on the element "([^"]*)"$/, function(className, next) {
        browser
            .getElementSize(className).then(function(result) {
                tmpResult = result;
                next();
            }, next);
    });

    this.When(/^I use getTitle\(\) to get the title of this website$/, function(next) {
        browser
            .getTitle().then(function(title) {
                tmpResult = title;
                next();
            }, next);
    });

    this.Then(/^I should get a width of "([^"]*)" and height of "([^"]*)"$/, function(width, height, next) {
        assert.equal(parseInt(tmpResult.width), parseInt(width, 10) , 'width of element is ' + tmpResult.width + ' but should be ' + width);
        assert.equal(parseInt(tmpResult.height), parseInt(height, 10), 'height of element is ' + tmpResult.height + ' but should be ' + height);
        next();
    });

    this.Then(/^the command should return "([^"]*)"$/, function(result, next) {
        assert(tmpResult == result , ' result of command is "'+ tmpResult + '" but should be "'+ result);
        next();
    });
};