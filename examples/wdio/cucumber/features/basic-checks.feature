Feature: Basic Checks
  As a user of WebdriverIO
  I should be able to use different commands
  to get information about elements on the page

  Scenario: Get size of an element
    Given I go to the website "https://webdriver.io/"
    Then should the element ".tagline" have text "Next-gen WebDriver test framework for Node.js"

  Scenario: Get title of website
    Given I go to the website "https://webdriver.io/"
    Then should the title of the page be "WebdriverIO · Next-gen WebDriver test framework for Node.js"
