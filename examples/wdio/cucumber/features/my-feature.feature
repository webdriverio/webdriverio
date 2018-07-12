Feature: Example feature
  As a user of WebdriverIO
  I should be able to use different commands
  to get informations about elements on the page

  Scenario: Get size of an element
    Given I go on the website "https://github.com/"
    Then  should the element ".header-logo-invertocat" be 32px wide and 32px high

  Scenario: Get title of website
    Given I go on the website "https://github.com/"
    Then  should the title of the page be "The world's leading software development platform · GitHub"
