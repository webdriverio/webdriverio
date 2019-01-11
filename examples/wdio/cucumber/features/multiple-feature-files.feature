Feature: Multiple Feature Files
  As a user of WebdriverIO with Cucumber
  I should be allowed to use as many feature files as I like


  Scenario: Going to Google
    Given I go to the website "https://www.google.com"
    Then should the title of the page be "Google"
