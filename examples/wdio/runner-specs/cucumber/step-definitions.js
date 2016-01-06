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

    this.Given(/^I go on the website "([^"]*)"$/, function(url) {
        browser.url(url);
    });

    this.Then(/^should the element "([^"]*)" be (\d+)px wide and (\d+)px high$/, function(selector, width, height) {
        var elemSize = browser.getElementSize(selector);
        assert.equal(elemSize.width, width, 'width of element is ' + elemSize.width + ' but should be ' + width);
        assert.equal(elemSize.height, height, 'height of element is ' + elemSize.height + ' but should be ' + height);
    });

    this.Then(/^should the title of the page be "([^"]*)"$/, function(expectedTitle) {
        var title = browser.getTitle();
        assert.equal(title, expectedTitle, ' title is "'+ title + '" but should be "'+ expectedTitle);
    });

};
