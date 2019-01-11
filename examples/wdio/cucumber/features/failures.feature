Feature: Failures
  As a user of WebdriverIO with Cucumber
  When my tests fail they should fail


  Scenario: Google is definitely not Bing
    Given I go to the website "https://www.google.com"
    Then should the title of the page be "Bing"
